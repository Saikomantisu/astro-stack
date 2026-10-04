import beatGrid from "./beats.json";

export const FPS = 60;
export const DURATION = 960;

const frames = beatGrid.beats.map((b) => b.frame);

/** Frame of beat `n` (0–31), measured from the track. n = 32 is the loop point. */
export const B = (n: number): number =>
  n >= frames.length ? DURATION : frames[n];
