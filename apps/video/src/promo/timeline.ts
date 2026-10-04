import beatGrid from "./beats.json";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 1800;

const frames = beatGrid.beats.map((b) => b.frame);

/** Frame of beat `n` (0–59), measured from the track. */
export const B = (n: number): number =>
  n < frames.length
    ? frames[n]
    : frames[frames.length - 1] + (n - frames.length + 1) * 30;

/** The "&" after beat `n`. */
export const H = (n: number): number => Math.round((B(n) + B(n + 1)) / 2);

/** Scene boundaries, in beats. */
export const SCENE = {
  hook: 0,
  promise: 7,
  cli: 14,
  grid: 28,
  restraint: 44,
  end: 52,
} as const;
