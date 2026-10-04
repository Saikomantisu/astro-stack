export const easings = {
  linear: (t: number): number => t,
  out: (t: number): number => 1 - (1 - t) ** 3,
  in: (t: number): number => t * t * t,
  inOut: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
} as const;

export type EasingName = keyof typeof easings;

export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

export const springs = {
  snappy: { damping: 18, stiffness: 220, mass: 0.7 },
  soft: { damping: 14, stiffness: 120, mass: 0.9 },
  bouncy: { damping: 10, stiffness: 180, mass: 0.8 },
  // Damping ratios 0.8–1: at most a ~1.5% overshoot.
  morph: { damping: 26, stiffness: 260, mass: 1 },
  swift: { damping: 40, stiffness: 520, mass: 1 },
  lag: { damping: 26, stiffness: 190, mass: 1 },
  glide: { damping: 21, stiffness: 120, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

export type SpringName = keyof typeof springs;

/**
 * Closed-form step response of a damped spring released at rest at 0 and
 * pulled toward 1, `seconds` after release. Pure, so it can be evaluated at
 * any (fractional) frame without carrying state.
 */
export function springStep(
  seconds: number,
  { damping, stiffness, mass }: SpringConfig,
): number {
  if (seconds <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * w0 * seconds) *
        (Math.cos(wd * seconds) + ((zeta * w0) / wd) * Math.sin(wd * seconds))
    );
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * seconds) * (1 + w0 * seconds);
  const s = w0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * w0 + s;
  const r2 = -zeta * w0 - s;
  return (
    1 + (r2 * Math.exp(r1 * seconds) - r1 * Math.exp(r2 * seconds)) / (r1 - r2)
  );
}
