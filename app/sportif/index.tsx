import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Type } from "../../constants/tokens";
import ExerciseThumb from "../../components/exercise-thumb";
import OzaResumeCard from "../../components/oza/resume-card";
import SportDashboard from "../../components/oza/sport-dashboard";
import ProfilePromptCard from "../../components/oza/profile-prompt-card";
import { AthleteProfile, getAthleteProfile } from "../../services/athlete-profile";
import NextSessionCard from "../../components/next-session-card";
import HeroHeader from "../../components/hero-header";
import SessionFeedbackCard from "../../components/session-feedback-card";
import WellnessSummaryCard from "../../components/wellness-summary-card";
import NextSessionWidget from "../../components/next-session-widget";
import PhotoBackground from "../../components/photo-background";
import SportifRoutine from "../../components/sportif-routine";
import {
  CoachWordCard,
  ProgressCard,
  TodayHero,
  TodoCard,
  TodoItem,
} from "../../components/sportif-home-cards";
import WeekScheduleCard from "../../components/week-schedule-card";
import WeekStrip from "../../components/week-strip";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { computeGoalProgress, getGoal, Goal } from "../../services/goals";
import { describeSpec } from "../../services/cardio";
import { todayKey } from "../../services/load";
import { ExerciseTemplate } from "../../constants/exercise-library";
import { getExerciseLibrary } from "../../services/exercises";
import { getFeedbackForSportif, markFeedbackSeen, SessionFeedback } from "../../services/session-feedback";
import { subscribeToConversationsForSportif } from "../../services/messages";
import { estimateSeanceMinutes, getProgrammesForSportif, Programme } from "../../services/programmes";
import { MUSCLE_ID_LABELS } from "../../constants/muscle-selection";
import { getOzaProgram, getOzaUserState, programProgress } from "../../services/oza-programs";
import { getSlotsForSportif, Slot } from "../../services/reservations";
import {
  computeDayState,
  addDays,
  computeScheduleStatuses,
  daysBetween,
  getScheduledForSportif,
  mondayOf,
  ScheduledSession,
  weekDates,
} from "../../services/schedule";
import { getNextSeance, getSeanceExerciseNames } from "../../services/session-muscles";
import {
  getLatestWellnessScore,
  getSessionsForSportif,
  getTodayWellness,
  getWellnessEntriesForSportif,
  SessionRecord,
} from "../../services/tracking";

export default function SportifHome() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [upcomingSlots, setUpcomingSlots] = useState<Slot[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [checkinDone, setCheckinDone] = useState(true);
  const [feedbacks, setFeedbacks] = useState<SessionFeedback[]>([]);
  // Visuels des exercices (bibliothèque de chaque coach auteur d'un programme).
  const [library, setLibrary] = useState<Map<string, ExerciseTemplate>>(new Map());
  // undefined = pas encore chargé ; null = questionnaire jamais abordé.
  const [athlete, setAthlete] = useState<AthleteProfile | null | undefined>(undefined);
  const [ozaResume, setOzaResume] = useState<{
    programId: string;
    programName: string;
    seanceId: string;
    seanceName: string;
    week: number;
    percent: number;
  } | null>(null);
  const [wellnessDelta, setWellnessDelta] = useState<number | null>(null);
  const [todayWellness, setTodayWellness] = useState<Awaited<ReturnType<typeof getTodayWellness>>>(null);
  const [goal, setGoalState] = useState<Goal | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledSession[]>([]);
  // Dernier message du coach (s'il a écrit en dernier) pour la carte "Mot de ton coach".
  const [coachWord, setCoachWord] = useState<{ coachId: string; coachName: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        setFirstName(userSnap.exists() ? userSnap.data().firstName : null);
        getAthleteProfile(user.uid).then(setAthlete).catch(() => setAthlete(undefined));

        const [sessionData, slotData, programmeData, todayScore, goalData] = await Promise.all([
          getSessionsForSportif(user.uid),
          getSlotsForSportif(user.uid),
          getProgrammesForSportif(user.uid),
          getLatestWellnessScore(user.uid),
          getGoal(user.uid),
        ]);
        setSessions(sessionData);
        setUpcomingSlots(slotData);
        setProgrammes(programmeData);
        setCheckinDone(todayScore !== null);
        try {
          setFeedbacks(await getFeedbackForSportif(user.uid));
        } catch {
          setFeedbacks([]);
        }
        // Reprise d'un programme OZA Programs en cours : un plus, sans effet sur le reste.
        try {
          const ozaState = await getOzaUserState(user.uid);
          const latest = Object.entries(ozaState.progress)
            .filter(([, p]) => p.currentSeanceId)
            .sort((a, b) => b[1].lastOpenedAt - a[1].lastOpenedAt)[0];
          if (latest) {
            const prog = await getOzaProgram(latest[0]);
            const se = prog?.semaines.flatMap((w) => w.seances).find((x) => x.id === latest[1].currentSeanceId);
            if (prog && prog.statut === "publie" && se) {
              setOzaResume({
                programId: prog.id,
                programName: prog.nom,
                seanceId: se.id,
                seanceName: se.nom,
                week: latest[1].currentWeek,
                percent: Math.round(programProgress(prog, latest[1]) * 100),
              });
            }
          }
        } catch {
          setOzaResume(null);
        }
        // Évolution sur la semaine (carte Bien-être) : un plus, sans elle la carte reste complète.
        try {
          const entries = await getWellnessEntriesForSportif(user.uid);
          const t = todayKey();
          const avgBetween = (from: string, to: string) => {
            const list = entries.filter((e) => e.date >= from && e.date <= to);
            return list.length > 0 ? list.reduce((sum, e) => sum + e.score, 0) / list.length : null;
          };
          const cur = avgBetween(addDays(t, -6), t);
          const prev = avgBetween(addDays(t, -13), addDays(t, -7));
          setWellnessDelta(cur !== null && prev !== null ? Math.round((cur - prev) * 10) : null);
        } catch {
          setWellnessDelta(null);
        }
        try {
          setTodayWellness(await getTodayWellness(user.uid));
        } catch {
          setTodayWellness(null);
        }
        setGoalState(goalData);

        // Planning posé par le coach : un échec (ex. règles pas encore
        // publiées) ne doit jamais empêcher d'afficher l'accueil.
        try {
          setScheduled(await getScheduledForSportif(user.uid));
        } catch {
          setScheduled([]);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      unsubscribe?.();
      if (!user) return;
      unsubscribe = subscribeToConversationsForSportif(user.uid, (list) => {
        const c = list.find((x) => x.lastMessageText && x.lastMessageSenderId === x.coachId);
        setCoachWord(
          c ? { coachId: c.coachId, coachName: c.coachName, text: c.lastMessageText } : null
        );
      });
    });
    return () => {
      unsubscribe?.();
      stopAuth();
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading]);

  // Sans visuels l'accueil reste complet : un échec est ignoré.
  const programmeCoachKey = Array.from(new Set(programmes.map((p) => p.coachId))).join(",");
  useEffect(() => {
    if (!programmeCoachKey) return;
    Promise.all(programmeCoachKey.split(",").map((c) => getExerciseLibrary(c).catch(() => [] as ExerciseTemplate[])))
      .then((lists) => setLibrary(new Map(lists.flat().map((e) => [e.id, e]))));
  }, [programmeCoachKey]);

  if (loading) {
    return <View style={styles.container} />;
  }

  const goalProgress = goal ? computeGoalProgress(goal) : null;

  const nextSeance = getNextSeance(programmes[0] ?? null, sessions);

  const today = todayKey();
  const weekAgo = addDays(today, -6);
  // Le retour le plus récent que le sportif n'a pas encore marqué comme lu.
  const unseenFeedback = feedbacks.find((f) => f.seenAt === null) ?? null;
  const monday = mondayOf(today);
  const weekDays = weekDates(monday);
  const scheduleStatuses = computeScheduleStatuses(scheduled, sessions, today);
  const sessionDates = new Set(sessions.map((s) => s.date));
  const dayStates = weekDays.map((d) =>
    computeDayState(d, scheduled, scheduleStatuses, sessionDates, today)
  );

  // Séances prévues aujourd'hui : la première non faite passe en grand.
  const todayItems = scheduled.filter((i) => i.date === today);
  const focusPending = todayItems.find((i) => scheduleStatuses.get(i.id) !== "done") ?? null;
  // Séances des jours passés restées en retard (7 derniers jours).
  const lateItems = scheduled
    .filter(
      (i) =>
        scheduleStatuses.get(i.id) === "late" &&
        daysBetween(i.date, today) > 0 &&
        daysBetween(i.date, today) <= 7
    )
    .slice(-3);

  function describeScheduled(item: ScheduledSession): string | undefined {
    if (item.kind === "cardio" && item.cardio) return describeSpec(item.cardio);
    if (item.kind === "programme") {
      const programme = programmes.find((p) => p.id === item.programmeId);
      const seance = programme?.seances.find((x) => x.id === item.seanceId);
      const count = seance ? getSeanceExerciseNames(seance).length : 0;
      return [item.programmeNom, count > 0 ? `${count} exercice${count > 1 ? "s" : ""}` : null]
        .filter(Boolean)
        .join(" · ");
    }
    return undefined;
  }
  const focusMeta = focusPending ? describeScheduled(focusPending) : undefined;
  const focusExerciseIds =
    focusPending?.kind === "programme"
      ? getSeanceExerciseNames(
          programmes
            .find((p) => p.id === focusPending.programmeId)
            ?.seances.find((x) => x.id === focusPending.seanceId) ?? null
        ).map((e) => e.id).filter((x): x is string => !!x)
      : [];
  const nextExerciseIds = getSeanceExerciseNames(nextSeance)
    .map((e) => e.id)
    .filter((x): x is string => !!x);

  function startScheduled(item: ScheduledSession) {
    if (item.kind === "cardio") router.push(`/sportif/cardio/${item.id}`);
    else if (item.kind === "programme" && item.programmeId && item.seanceId) {
      router.push(`/sportif/programme/${item.programmeId}/seance/${item.seanceId}`);
    } else router.push("/sportif/nouvelle-seance");
  }

  // ── « Prochaine séance » (maquette) : la séance du jour si elle est prévue,
  // sinon la prochaine du planning, sinon la suite du programme.
  function seanceOfItem(item: ScheduledSession) {
    return item.kind === "programme"
      ? programmes.find((p) => p.id === item.programmeId)?.seances.find((x) => x.id === item.seanceId) ?? null
      : null;
  }
  function focusOf(seance: ReturnType<typeof seanceOfItem>): string[] {
    return (seance?.muscles ?? []).slice(0, 2).map((m) => MUSCLE_ID_LABELS[m]);
  }
  function dayWord(date: string): string {
    const diff = daysBetween(today, date);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Demain";
    const [y, m, d] = date.split("-").map(Number);
    const label = new Date(y, m - 1, d, 12).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const upcomingScheduled = scheduled
    .filter((i) => i.date > today && scheduleStatuses.get(i.id) !== "done")
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextItem = focusPending ?? upcomingScheduled ?? null;
  const nextItemSeance = nextItem ? seanceOfItem(nextItem) : null;
  const nextItemMinutes = nextItemSeance ? estimateSeanceMinutes(nextItemSeance) : 0;
  const nextCard: {
    title: string;
    when?: string;
    meta?: string;
    focus?: string[];
    done?: boolean;
    emptyText?: string;
    buttonLabel?: string;
    onStart?: () => void;
    onPress?: () => void;
    exerciseIds: string[];
  } = nextItem
    ? {
        title: nextItem.titre,
        when: [dayWord(nextItem.date), nextItemMinutes > 0 ? `${nextItemMinutes} min` : null].filter(Boolean).join(" · "),
        meta: focusMeta,
        focus: focusOf(nextItemSeance),
        buttonLabel: nextItem === focusPending ? "Démarrer la séance" : undefined,
        onStart: nextItem === focusPending ? () => startScheduled(nextItem) : undefined,
        onPress: () => startScheduled(nextItem),
        exerciseIds: (nextItem === focusPending ? focusExerciseIds : getSeanceExerciseNames(nextItemSeance).map((e) => e.id).filter((x): x is string => !!x)),
      }
    : todayItems.length > 0
    ? { title: "Séance terminée", done: true, emptyText: "Bien joué, à demain pour la suite.", exerciseIds: [] }
    : nextSeance && programmes[0]
    ? {
        title: nextSeance.nom,
        meta: programmes[0].nom,
        focus: (nextSeance.muscles ?? []).slice(0, 2).map((m) => MUSCLE_ID_LABELS[m]),
        onPress: () => router.push(`/sportif/programme/${programmes[0].id}`),
        exerciseIds: nextExerciseIds,
      }
    : {
        title: "Rien de prévu",
        emptyText:
          upcomingSlots.length > 0
            ? `Prochain créneau : ${upcomingSlots[0].date} · ${upcomingSlots[0].heureDebut}`
            : "Ton coach n'a pas encore planifié de séance.",
        exerciseIds: [],
      };

  const todoItems: TodoItem[] = [
    {
      key: "checkin",
      label: "Check-in du jour",
      done: checkinDone,
      onPress: () => router.push("/sportif/checkin"),
    },
    ...todayItems.map((i) => ({
      key: i.id,
      label: i.titre,
      done: scheduleStatuses.get(i.id) === "done",
      onPress: () => startScheduled(i),
    })),
    ...lateItems.map((i) => ({
      key: i.id,
      label: `${i.titre} (en retard)`,
      done: false,
      late: true,
      onPress: () => startScheduled(i),
    })),
  ];

  const weekItemsAll = scheduled.filter((i) => weekDays.includes(i.date));
  const upcomingItems = weekItemsAll
    .filter((i) => i.date > today)
    .map((item) => ({ item, dayIndex: weekDays.indexOf(item.date) }));
  const weekDoneCount =
    weekItemsAll.length > 0
      ? weekItemsAll.filter((i) => scheduleStatuses.get(i.id) === "done").length
      : sessions.filter((s) => weekDays.includes(s.date)).length;

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="accueil" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View
        style={{ opacity: fade, transform: [{ translateY: slide }] }}
      >
        <HeroHeader title={`Bonjour ${firstName ?? ""} 👋`} subtitle="Prêt pour ta séance du jour ?" />
        {unseenFeedback && (
          <SessionFeedbackCard
            feedback={unseenFeedback}
            onSeen={() => {
              setFeedbacks((prev) => prev.map((f) => (f.id === unseenFeedback.id ? { ...f, seenAt: Date.now() } : f)));
              markFeedbackSeen(unseenFeedback.id).catch(() => {});
            }}
          />
        )}
        {athlete !== undefined && !athlete?.completed && (
          <ProfilePromptCard onPress={() => router.push("/onboarding?edit=1" as never)} />
        )}
        {uid && athlete?.sportId ? <SportDashboard uid={uid} profile={athlete} sessions={sessions} /> : null}
        <WellnessSummaryCard
          wellness={todayWellness}
          weekLoad={sessions.filter((s) => s.date >= weekAgo).reduce((sum, s) => sum + s.load, 0)}
          onCheckin={() => router.push("/sportif/checkin")}
          deltaPercent={wellnessDelta}
          onOpen={() => router.push("/sportif/bien-etre")}
        />

        {ozaResume && (
          <OzaResumeCard
            programName={ozaResume.programName}
            seanceName={ozaResume.seanceName}
            week={ozaResume.week}
            percent={ozaResume.percent}
            onPress={() => router.push(`/sportif/oza/seance/${ozaResume.programId}/${ozaResume.seanceId}?week=${ozaResume.week}`)}
          />
        )}

        <NextSessionCard
          {...nextCard}
          thumb={nextCard.exerciseIds.length > 0 ? <ExerciseThumb exercise={library.get(nextCard.exerciseIds[0])} size={84} radius={16} /> : undefined}
          onSeeAll={() => router.push("/sportif/programmes")}
        />

        <WeekStrip states={dayStates} />

        <TodoCard items={todoItems} />

        {uid && <SportifRoutine sportifId={uid} mode="home" />}

        {upcomingItems.length > 0 && (
          <>
            <Text style={styles.upcomingLabel}>À venir cette semaine</Text>
            <WeekScheduleCard items={upcomingItems} statuses={scheduleStatuses} />
          </>
        )}

        {coachWord && (
          <CoachWordCard
            coachName={coachWord.coachName}
            text={coachWord.text}
            onPress={() => router.push(`/sportif/messages/${coachWord.coachId}`)}
          />
        )}

        <ProgressCard
          weekDone={weekDoneCount}
          weekTotal={weekItemsAll.length > 0 ? weekItemsAll.length : null}
          goalLabel={goal?.description ?? null}
          goalProgress={goalProgress}
          onPressGoal={() => router.push("/sportif/objectif")}
          onPressHistory={() => router.push("/sportif/historique")}
        />

        <TouchableOpacity
          style={styles.freeSessionLink}
          onPress={() => router.push("/sportif/nouvelle-seance")}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.text} />
          <Text style={styles.freeSessionText}>Enregistrer une séance libre</Text>
        </TouchableOpacity>
      </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },

  header: {
    position: "relative",
    overflow: "hidden",
  },

  greeting: {
    fontFamily: Type.heading,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },



  todayList: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 24,
    overflow: "hidden",
  },












  upcomingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  freeSessionLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },

  freeSessionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
});
