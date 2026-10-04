import type { CSSProperties } from "react";
import { keystrokeFrames, springs } from "../lib/remocn-ui";
import { shadow } from "../shared/theme";
import { logStep, logSuccess, selectPrompt } from "../terminal/clack";
import { mono } from "../terminal/font";
import {
  CELL_H,
  CELL_W,
  type Line,
  lineWidth,
  palette,
  s,
} from "../terminal/grid";
import { type Row, shellPrompt, toRow } from "../terminal/session";
import { CellView } from "../terminal/Terminal";
import { presence, track } from "./motion";
import { B, H } from "./timeline";

const COMMAND = "pnpm create astro-stack";

export const cliKeys = keystrokeFrames(
  [
    { text: "pnpm ", at: B(14) + 8, span: 16 },
    { text: "create ", at: B(15) + 4, span: 22 },
    { text: "astro-stack", at: B(16) + 2, span: 34 },
  ],
  1.2,
  41,
);

/**
 * The CLI scene's terminal: the real clack prompts on the same character grid
 * as the terminal video, answered on the beat. Keys move the ● selector;
 * every Enter lands on a beat.
 */
export const TERM = {
  enter: B(18),
  type: {
    appear: B(18) + 2,
    ups: [10, 14, 18, 22, 26].map((d) => B(18) + d),
    done: B(20),
  },
  css: { appear: B(20) + 2, downs: [H(20) + 4], done: B(22) },
  deploy: { appear: B(22) + 2, downs: [H(22) - 2, H(22) + 6], done: B(24) },
  launch: { appear: B(24) + 2, done: B(25) },
  preparing: B(25) + 2,
  ready: B(26),
  exit: B(27),
} as const;

const TYPES = [
  "Marketing site",
  "Client project",
  "Blog",
  "Documentation",
  "Portfolio",
  "Blank project",
];

const pressed = (keys: readonly number[], t: number) =>
  keys.filter((k) => k <= t).length;

function rowsAt(t: number): {
  rows: Row[];
  cursor: { row: number; col: number } | null;
} {
  const count = cliKeys.filter((k) => k.frame <= t).length;
  const prompt: Line = [
    ...shellPrompt("~/clients"),
    s(COMMAND.slice(0, count)),
  ];
  const rows: Row[] = [toRow(prompt)];
  if (t < TERM.enter)
    return { rows, cursor: { row: 0, col: lineWidth(prompt) } };

  const add = (lines: Line[]) => rows.push(...lines.map(toRow));
  if (t >= TERM.type.appear) {
    const cursor = (5 - pressed(TERM.type.ups, t) + 6) % 6;
    add(
      selectPrompt(
        "What are you building?",
        TYPES.map((label) => ({ label })),
        cursor,
        t >= TERM.type.done,
      ),
    );
  }
  if (t >= TERM.css.appear)
    add(
      selectPrompt(
        "Styling: CSS",
        [{ label: "Vanilla CSS" }, { label: "Tailwind CSS" }],
        pressed(TERM.css.downs, t),
        t >= TERM.css.done,
      ),
    );
  if (t >= TERM.deploy.appear)
    add(
      selectPrompt(
        "Deployment target",
        ["Static site", "Vercel", "Netlify", "Cloudflare"].map((label) => ({
          label,
        })),
        pressed(TERM.deploy.downs, t),
        t >= TERM.deploy.done,
      ),
    );
  if (t >= TERM.launch.appear)
    add(
      selectPrompt(
        "Launch this project?",
        [{ label: "Launch project" }, { label: "Cancel" }],
        0,
        t >= TERM.launch.done,
      ),
    );
  if (t >= TERM.preparing)
    add(logStep([s("Preparing your project for launch...")]));
  if (t >= TERM.ready)
    add(
      logSuccess([
        s("✦ PROJECT READY ✦", { fg: "peach", bold: true }),
        s("  "),
        s("acme-studio", { fg: "violet", bold: true }),
        s(" is ready for liftoff."),
      ]),
    );
  return { rows, cursor: null };
}

const COLS = 56;
const ROWS = 18;
const PAD = 30;
const BAR = 46;
/** The grid uses the terminal video's cell size; this scales it as one layer. */
const SCALE = 0.96;
const heightFor = (rows: number) =>
  Math.round((rows * CELL_H + PAD * 2) * SCALE) + BAR;
export const WINDOW = { w: Math.round((COLS * CELL_W + PAD * 2) * SCALE) };

/** The window grows to fit each prompt as it prints. */
const SIZES = [
  0,
  TERM.type.appear,
  TERM.type.done,
  TERM.css.appear,
  TERM.deploy.appear,
  TERM.launch.appear,
  TERM.preparing,
  TERM.ready,
].map((at) => ({
  at,
  value: heightFor(Math.max(3, Math.min(ROWS, rowsAt(at + 1).rows.length))),
}));

export function TerminalCli({
  frame,
  style,
}: {
  frame: number;
  style?: CSSProperties;
}) {
  const p = presence(frame, B(14), TERM.exit, springs.swift, springs.swift);
  if (p.v <= 0.001) return null;
  const { rows, cursor } = rowsAt(frame);
  const visible = rows.slice(Math.max(0, rows.length - ROWS));
  const h = track(frame, SIZES, springs.morph);
  const blinkOn =
    cursor &&
    (cliKeys.some((k) => k.frame <= frame && frame - k.frame < 12) ||
      frame % 30 < 15);
  return (
    <div
      style={{
        position: "absolute",
        width: WINDOW.w,
        height: h,
        marginTop: -h / 2,
        borderRadius: 26,
        background: palette.background,
        boxShadow: `${shadow}, 0 30px 80px rgba(20, 16, 10, 0.18)`,
        overflow: "hidden",
        opacity: p.v,
        transform: `translateY(${(1 - p.enter) * 30}px) scale(${0.94 + 0.06 * p.enter})`,
        filter: p.v < 0.999 ? `blur(${(1 - p.v) * 12}px)` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          height: BAR,
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontSize: 16,
          color: palette.gray,
        }}
      >
        ~/clients
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BAR,
          width: COLS * CELL_W + PAD * 2,
          height: ROWS * CELL_H + PAD * 2,
          transform: `scale(${SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        {visible.flatMap((row, r) =>
          row.map((cell, c) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a cell's identity is its grid position.
            <CellView key={`${r}:${c}`} cell={cell} row={r} col={c} pad={PAD} />
          )),
        )}
        {cursor && blinkOn ? (
          <div
            style={{
              position: "absolute",
              left: PAD + cursor.col * CELL_W,
              top: PAD + cursor.row * CELL_H + 2,
              width: CELL_W,
              height: CELL_H - 4,
              background: palette.foreground,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export const TERMINAL_MOVES = [
  ...TERM.type.ups,
  ...TERM.css.downs,
  ...TERM.deploy.downs,
];
export const TERMINAL_ENTERS = [
  TERM.enter,
  TERM.type.done,
  TERM.css.done,
  TERM.deploy.done,
  TERM.launch.done,
];
