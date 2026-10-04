import { type SpringKey, springs, springTrack } from "../lib/remocn-ui";
import { CELL_H, CELL_W, PAD, SIZE } from "./grid";
import { LAUNCH, PROMPTS, screenAt, T } from "./session";
import { B, DURATION, FPS } from "./timeline";

interface Shot {
  at: number;
  scale: number;
  /** A faster spring, so the loop's final move is at rest by frame 0. */
  quick?: boolean;
  /** Frame whose screen decides what to frame (defaults to `at` + 1). */
  look?: number;
}

/** Each shot frames the screen's active block at the given zoom. */
const SHOTS: Shot[] = [
  { at: T.commandEnter, scale: 2.0, look: T.name + 1 },
  ...PROMPTS.map((p) => ({ at: p.appear - 1, scale: 2.0, look: p.enter - 1 })),
  { at: T.flightPlan, scale: 1.55, look: T.flightPlan + 40 },
  { at: T.pullBack, scale: 1.0 },
  { at: LAUNCH.appear, scale: 1.45, look: LAUNCH.appear + 1 },
  { at: T.preparing, scale: 1.4, look: T.packages + 20 },
  { at: T.deps, scale: 1.6, look: T.deps + 28 },
  { at: T.ready, scale: 1.9, look: T.ready + 1 },
  { at: T.card, scale: 1.22, look: T.card + 18 },
  { at: T.devPrompt, scale: 1.9, look: T.devPrompt + 1 },
  { at: T.local, scale: 2.2, look: T.local + 4 },
  { at: B(30) + 2, scale: 1.9, look: T.local + 4 },
  // Glide home from the ^C so the cleared prompt is framed as it appears.
  { at: T.interrupt, scale: 2.3, look: T.clear + 1, quick: true },
];

/**
 * Zoom and view centre (world px) that frame the active block: never so close
 * that its widest line is cut, and kept inside the grid.
 */
function target(shot: Shot): { scale: number; x: number; y: number } {
  if (shot.scale <= 1) return { scale: 1, x: SIZE / 2, y: SIZE / 2 };
  const { focus } = screenAt(shot.look ?? shot.at + 1);
  const needed = PAD * 2 + focus.cols * CELL_W;
  const scale = Math.min(shot.scale, SIZE / needed);
  const view = SIZE / scale;
  const mid = PAD + ((focus.from + focus.to + 1) / 2) * CELL_H;
  const clamp = (v: number) => Math.min(SIZE - view / 2, Math.max(view / 2, v));
  // Terminals read from the left edge: keep column 0 in view.
  return { scale, x: view / 2, y: clamp(mid) };
}

const keys = SHOTS.map((shot) => ({ shot, ...target(shot) }));
const asKeys = (pick: (k: (typeof keys)[number]) => number): SpringKey[] =>
  keys.map((k) => ({
    at: k.shot.at,
    value: pick(k),
    ...(k.shot.quick ? { spring: springs.swift } : {}),
  }));

const scaleKeys = asKeys((k) => k.scale);
const xKeys = asKeys((k) => k.x);
const yKeys = asKeys((k) => k.y);

/** The only smooth motion: a looping spring camera over the grid. */
export function cameraAt(frame: number): {
  scale: number;
  x: number;
  y: number;
} {
  const opts = { fps: FPS, spring: springs.glide, period: DURATION };
  return {
    scale: springTrack(frame, scaleKeys, opts),
    x: springTrack(frame, xKeys, opts),
    y: springTrack(frame, yKeys, opts),
  };
}
