import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// Disque OZA 3D (élément signature) : un disque d'haltère métallique bleu
// turquoise — jante biseautée, gorges concentriques, reflets spéculaires, moyeu
// central percé et le mot OZA en relief en haut et (inversé) en bas.
export default function OzaDisc({ size = 300 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 1.04} viewBox="0 0 300 312">
      <Defs>
        <LinearGradient id="rim" x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#B6FFF3" />
          <Stop offset="18%" stopColor="#3FE0CB" />
          <Stop offset="55%" stopColor="#0E8F82" />
          <Stop offset="100%" stopColor="#04302C" />
        </LinearGradient>
        <LinearGradient id="rimInner" x1="90%" y1="100%" x2="10%" y2="0%">
          <Stop offset="0%" stopColor="#7BF2E1" />
          <Stop offset="45%" stopColor="#0F9A8C" />
          <Stop offset="100%" stopColor="#053C37" />
        </LinearGradient>
        <RadialGradient id="face" cx="32%" cy="26%" r="85%">
          <Stop offset="0%" stopColor="#4CE6D2" />
          <Stop offset="42%" stopColor="#15A596" />
          <Stop offset="78%" stopColor="#0A6258" />
          <Stop offset="100%" stopColor="#052F2B" />
        </RadialGradient>
        <RadialGradient id="hub" cx="38%" cy="30%" r="80%">
          <Stop offset="0%" stopColor="#8DF6E7" />
          <Stop offset="50%" stopColor="#1BA899" />
          <Stop offset="100%" stopColor="#053B36" />
        </RadialGradient>
        <RadialGradient id="spec" cx="28%" cy="18%" r="48%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="floor" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#000000" stopOpacity={0.45} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="text" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0C5A52" />
          <Stop offset="100%" stopColor="#042622" />
        </LinearGradient>
      </Defs>

      {/* ombre au sol */}
      <Ellipse cx={150} cy={294} rx={120} ry={13} fill="url(#floor)" />

      {/* épaisseur du disque */}
      <Circle cx={150} cy={158} r={142} fill="#031F1C" />
      <Circle cx={150} cy={154} r={142} fill="url(#rim)" />
      <Circle cx={150} cy={154} r={131} fill="url(#rimInner)" />
      <Circle cx={150} cy={154} r={124} fill="url(#face)" />

      {/* gorges concentriques */}
      <Circle cx={150} cy={154} r={108} fill="none" stroke="#041F1C" strokeOpacity={0.45} strokeWidth={3} />
      <Circle cx={150} cy={154} r={105} fill="none" stroke="#7BF2E1" strokeOpacity={0.35} strokeWidth={1.5} />
      <Circle cx={150} cy={154} r={78} fill="none" stroke="#041F1C" strokeOpacity={0.4} strokeWidth={3} />
      <Circle cx={150} cy={154} r={75} fill="none" stroke="#7BF2E1" strokeOpacity={0.3} strokeWidth={1.5} />

      {/* OZA en relief (haut) et inversé (bas) */}
      <G>
        <SvgText x={151} y={83} fontSize={38} fontWeight="900" fontStyle="italic" fontFamily="Helvetica, Arial, sans-serif" fill="#7BF2E1" fillOpacity={0.5} textAnchor="middle">
          OZA
        </SvgText>
        <SvgText x={150} y={81} fontSize={38} fontWeight="900" fontStyle="italic" fontFamily="Helvetica, Arial, sans-serif" fill="url(#text)" textAnchor="middle">
          OZA
        </SvgText>
      </G>
      <G transform="rotate(180 150 154)">
        <SvgText x={151} y={83} fontSize={38} fontWeight="900" fontStyle="italic" fontFamily="Helvetica, Arial, sans-serif" fill="#7BF2E1" fillOpacity={0.5} textAnchor="middle">
          OZA
        </SvgText>
        <SvgText x={150} y={81} fontSize={38} fontWeight="900" fontStyle="italic" fontFamily="Helvetica, Arial, sans-serif" fill="url(#text)" textAnchor="middle">
          OZA
        </SvgText>
      </G>

      {/* moyeu */}
      <Circle cx={150} cy={154} r={46} fill="#031F1C" opacity={0.5} />
      <Circle cx={150} cy={152} r={44} fill="url(#hub)" />
      <Circle cx={150} cy={152} r={44} fill="none" stroke="#B6FFF3" strokeOpacity={0.55} strokeWidth={2} />
      <Circle cx={150} cy={152} r={19} fill="#021A17" />
      <Circle cx={150} cy={152} r={19} fill="none" stroke="#3FE0CB" strokeOpacity={0.5} strokeWidth={2} />

      {/* reflets */}
      <Circle cx={150} cy={154} r={142} fill="url(#spec)" />
      <Ellipse cx={104} cy={72} rx={52} ry={20} fill="#FFFFFF" fillOpacity={0.14} transform="rotate(-32 104 72)" />
    </Svg>
  );
}
