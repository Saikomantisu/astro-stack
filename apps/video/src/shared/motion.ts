import type { CSSProperties } from "react";
import type { SpringConfig } from "../lib/remocn-ui";

export interface Presence {
  /** 0 → 1 as it enters. */
  enter: number;
  /** 0 → 1 as it leaves. */
  exit: number;
  /** Net visibility, 0–1. */
  v: number;
}

export const exitFast: SpringConfig = { damping: 46, stiffness: 900, mass: 1 };

/** Opacity, blur and drift for content swapping in and out. */
export function swapStyle(
  p: Presence,
  { blur = 10, rise = 14 }: { blur?: number; rise?: number } = {},
): CSSProperties {
  const hidden = 1 - p.v;
  const y = (1 - p.enter) * rise - p.exit * rise * 0.6;
  const b = hidden * blur;
  return {
    opacity: p.v ** 1.4,
    transform: `translateY(${y}px)`,
    filter: b > 0.05 ? `blur(${b}px)` : undefined,
  };
}

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

export function mixColor(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const c = pa.map((v, i) =>
    Math.round(mix(v, pb[i], Math.max(0, Math.min(1, t)))),
  );
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
