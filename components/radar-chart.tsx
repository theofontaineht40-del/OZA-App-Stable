import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

import { Colors } from "../constants/colors";

const SIZE = 300;
const CENTER = SIZE / 2;
const MAX_RADIUS = SIZE / 2 - 20;
const MAX_VALUE = 10;

function pointFor(index: number, total: number, value: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = (value / MAX_VALUE) * MAX_RADIUS;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function polygonPoints(values: number[]) {
  return values
    .map((v, i) => {
      const p = pointFor(i, values.length, v);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

export function RadarChart({
  axesCount,
  seriesA,
  seriesB,
  colorA = Colors.primary,
  colorB = Colors.text,
  labels,
}: {
  axesCount: number;
  seriesA: number[];
  seriesB?: number[];
  colorA?: string;
  colorB?: string;
  // Noms des axes, affichés aux sommets (même ordre que les séries).
  labels?: string[];
}) {
  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <Svg width={SIZE} height={SIZE}>
      {gridLevels.map((level) => (
        <Polygon
          key={level}
          points={polygonPoints(Array(axesCount).fill(level))}
          fill="none"
          stroke={Colors.grayMedium}
          strokeWidth={1}
        />
      ))}

      {Array.from({ length: axesCount }, (_, i) => {
        const p = pointFor(i, axesCount, MAX_VALUE);
        return (
          <Line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke={Colors.grayMedium}
            strokeWidth={1}
          />
        );
      })}

      {seriesB && (
        <Polygon
          points={polygonPoints(seriesB)}
          fill={colorB}
          fillOpacity={0.15}
          stroke={colorB}
          strokeWidth={2}
        />
      )}

      <Polygon
        points={polygonPoints(seriesA)}
        fill={colorA}
        fillOpacity={0.25}
        stroke={colorA}
        strokeWidth={2}
      />

      <Circle cx={CENTER} cy={CENTER} r={2} fill={Colors.textSecondary} />

      {labels?.map((label, i) => {
        const p = pointFor(i, axesCount, MAX_VALUE + 1.6);
        const anchor = p.x < CENTER - 10 ? "end" : p.x > CENTER + 10 ? "start" : "middle";
        return (
          <SvgText
            key={label}
            x={p.x}
            y={p.y + 4}
            fontSize={11.5}
            fontWeight="700"
            fill={Colors.primaryDark}
            textAnchor={anchor}
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
