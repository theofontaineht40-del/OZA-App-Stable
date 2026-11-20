import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// Disque OZA 3D (élément signature) : un disque d'haltère métallique bleu
// turquoise, dessiné en vectoriel — bord biseauté, reflets, moyeu central et
// le mot OZA gravé en haut et (inversé) en bas, comme sur la maquette.
export default function OzaDisc({ size = 260 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        <LinearGradient id="rim" x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#7FEBDD" />
          <Stop offset="35%" stopColor="#14B8A6" />
          <Stop offset="70%" stopColor="#0A5A53" />
          <Stop offset="100%" stopColor="#062B28" />
        </LinearGradient>
        <RadialGradient id="face" cx="35%" cy="30%" r="80%">
          <Stop offset="0%" stopColor="#2FC7B5" />
          <Stop offset="55%" stopColor="#0F7F74" />
          <Stop offset="100%" stopColor="#073F3A" />
        </RadialGradient>
        <RadialGradient id="hub" cx="40%" cy="35%" r="75%">
          <Stop offset="0%" stopColor="#5FE3D2" />
          <Stop offset="60%" stopColor="#0E8C80" />
          <Stop offset="100%" stopColor="#053A35" />
        </RadialGradient>
        <RadialGradient id="shine" cx="30%" cy="20%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.45} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={150} cy={152} r={142} fill="#021F1D" opacity={0.35} />
      <Circle cx={150} cy={150} r={140} fill="url(#rim)" />
      <Circle cx={150} cy={150} r={126} fill="url(#face)" />
      <Circle cx={150} cy={150} r={104} fill="none" stroke="#7FEBDD" strokeOpacity={0.35} strokeWidth={2} />
      <Circle cx={150} cy={150} r={84} fill="none" stroke="#021F1D" strokeOpacity={0.35} strokeWidth={3} />
      <SvgText x={150} y={80} fontSize={34} fontWeight="800" fontFamily="Helvetica, Arial, sans-serif" fill="#0A5A53" fillOpacity={0.9} textAnchor="middle">
        OZA
      </SvgText>
      <SvgText
        x={150}
        y={80}
        fontSize={34}
        fontWeight="800"
        fontFamily="Helvetica, Arial, sans-serif"
        fill="#0A5A53"
        fillOpacity={0.9}
        textAnchor="middle"
        transform="rotate(180 150 150)"
      >
        OZA
      </SvgText>
      <Circle cx={150} cy={150} r={44} fill="url(#hub)" />
      <Circle cx={150} cy={150} r={44} fill="none" stroke="#7FEBDD" strokeOpacity={0.5} strokeWidth={2} />
      <Circle cx={150} cy={150} r={17} fill="#031C1A" />
      <Circle cx={150} cy={150} r={140} fill="url(#shine)" />
    </Svg>
  );
}
