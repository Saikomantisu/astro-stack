import { useCurrentFrame, useVideoConfig } from "remotion";
import { type SpringConfig, springStep, springs } from "./motion";
import type { Step } from "./types";

export function framesFor(
  d: number | { seconds: number },
  fps: number,
): number {
  return typeof d === "number" ? d : Math.round(d.seconds * fps);
}

export function revealCount(
  localFrame: number,
  fps: number,
  len: number,
  cps: number,
): number {
  const over = (len / cps) * fps;
  if (over <= 0) return len;
  return Math.max(0, Math.min(len, Math.floor((localFrame / over) * len)));
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function revealedText(full: string, count: number): string {
  const c = Math.max(0, Math.min(full.length, Math.floor(count)));
  return full.slice(0, c);
}

export interface TypewriterOptions {
  cps?: number;
  speed?: number;
  startFrame?: number;
}

export interface TypewriterState {
  text: string;
  count: number;
  done: boolean;
  typing: boolean;
}

export function useTypewriter(
  full: string,
  options: TypewriterOptions = {},
): TypewriterState {
  const { cps = 20, speed = 1, startFrame = 0 } = options;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame * speed - startFrame;
  const count = local <= 0 ? 0 : revealCount(local, fps, full.length, cps);
  return {
    text: revealedText(full, count),
    count,
    done: count >= full.length,
    typing: count > 0 && count < full.length,
  };
}

export function useCurrentState<S extends string>(
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
): S {
  const effectiveFrame = useCurrentFrame() * speed;
  let current = defaultState;
  let bestAt = -Infinity;
  steps.forEach((step) => {
    if (step.at <= effectiveFrame && step.at >= bestAt) {
      bestAt = step.at;
      current = step.state;
    }
  });
  return current;
}

export function useStateTransition<S extends string>(
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
  defaultDuration = 8,
): { from: S; to: S; progress: number } {
  const effectiveFrame = useCurrentFrame() * speed;
  const started = steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => a.step.at - b.step.at || a.index - b.index)
    .filter((e) => e.step.at <= effectiveFrame);
  if (started.length === 0)
    return { from: defaultState, to: defaultState, progress: 1 };
  const to = started[started.length - 1].step;
  const from = started.length >= 2 ? started[started.length - 2].step : null;
  const dur = to.duration ?? defaultDuration;
  const progress = dur > 0 ? clamp01((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}

export interface SpringKey {
  /** Frame at which the value starts heading to `value`. */
  at: number;
  value: number;
  /** Spring for this change; a function picks one from the change's sign. */
  spring?: SpringConfig | ((delta: number) => SpringConfig);
}

export interface SpringTrackOptions {
  fps: number;
  spring?: SpringConfig;
  /**
   * Loop length in frames. The change into the first key comes from the last
   * key's value and the previous loop's tails are included, so frame `period`
   * equals frame 0 exactly, position and velocity alike.
   */
  period?: number;
}

/**
 * A value that changes target many times, as the sum of one closed-form
 * spring per change: base + Σ Δᵢ · step(t − atᵢ). Still a pure function of
 * the frame. Keys must be sorted by `at` (and lie in [0, period) when looping).
 */
export function springTrack(
  frame: number,
  keys: readonly SpringKey[],
  { fps, spring = springs.morph, period }: SpringTrackOptions,
): number {
  if (keys.length === 0) return 0;
  const last = keys[keys.length - 1].value;
  let value = period ? last : keys[0].value;
  const copies = period ? [-period, 0] : [0];
  keys.forEach((key, i) => {
    const prev = i === 0 ? last : keys[i - 1].value;
    const delta = key.value - prev;
    if (delta === 0 || (i === 0 && !period)) return;
    const config =
      typeof key.spring === "function"
        ? key.spring(delta)
        : (key.spring ?? spring);
    for (const offset of copies) {
      value += delta * springStep((frame - key.at - offset) / fps, config);
    }
  });
  return value;
}

export interface TypedGroup {
  text: string;
  /** Frame the first character of the group lands on. */
  at: number;
  /** Frames between the first and last keystroke of the group. */
  span: number;
}

/**
 * Per-character keystroke frames: each group starts on its (beat-aligned)
 * frame and spreads its characters over `span`, nudged by a deterministic
 * ±`jitter` frames so it reads as a person typing.
 */
export function keystrokeFrames(
  groups: readonly TypedGroup[],
  jitter = 1.2,
  seed = 1,
): { char: string; frame: number }[] {
  const out: { char: string; frame: number }[] = [];
  let n = seed;
  const rand = () => {
    n = (n * 16807) % 2147483647;
    return n / 2147483647;
  };
  for (const group of groups) {
    const count = group.text.length;
    const step = count > 1 ? group.span / (count - 1) : 0;
    [...group.text].forEach((char, i) => {
      const wobble =
        i === 0 ? 0 : (rand() * 2 - 1) * Math.min(jitter, step * 0.4);
      out.push({ char, frame: group.at + i * step + wobble });
    });
  }
  return out;
}
