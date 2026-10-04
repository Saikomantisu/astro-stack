import {
  type SpringConfig,
  type SpringKey,
  springStep,
  springs,
  springTrack,
} from "../lib/remocn-ui";
import { exitFast, type Presence } from "../shared/motion";
import { FPS } from "./timeline";

export { mix, mixColor, swapStyle } from "../shared/motion";
export type { Presence };

/** A spring track for a one-way (non-looping) timeline. */
export const track = (
  frame: number,
  keys: readonly SpringKey[],
  spring: SpringConfig = springs.morph,
): number => springTrack(frame, keys, { fps: FPS, spring });

/** 0 → 1 spring released at `at`. */
export const after = (
  frame: number,
  at: number,
  spring: SpringConfig = springs.swift,
): number => springStep((frame - at) / FPS, spring);

/** Visible from `enterAt` until `exitAt`, each edge with its own spring. */
export function presence(
  frame: number,
  enterAt: number,
  exitAt = Infinity,
  enterSpring: SpringConfig = springs.swift,
  exitSpring: SpringConfig = exitFast,
): Presence {
  const enter = after(frame, enterAt, enterSpring);
  const exit = Math.min(enter, after(frame, exitAt, exitSpring));
  return { enter, exit, v: Math.max(0, Math.min(1, enter - exit)) };
}

/** A press: dips toward `depth` around `at` and springs back. */
export function press(frame: number, at: number, depth = 0.94): number {
  const down = after(frame, at - 3);
  const up = after(frame, at + 4, springs.morph);
  return 1 - (1 - depth) * Math.max(0, down - up);
}
