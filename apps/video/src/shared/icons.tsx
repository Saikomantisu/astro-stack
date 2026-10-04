import type { CSSProperties } from "react";

/** One stroke weight for every icon. */
const STROKE = 1.75;

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const base = (size: number, color: string, style?: CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: STROKE,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style: { display: "block", ...style },
});

/** Check mark; `draw` 0–1 strokes it on. */
export function Check({
  size = 24,
  color = "currentColor",
  style,
  draw = 1,
  weight = STROKE,
}: IconProps & { draw?: number; weight?: number }) {
  return (
    <svg {...base(size, color, style)} strokeWidth={weight} aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    </svg>
  );
}
