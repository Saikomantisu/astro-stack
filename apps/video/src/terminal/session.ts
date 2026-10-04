/**
 * The whole session as timestamped events. `screenAt(t)` is a pure function
 * of those events: it rebuilds the transcript from scratch for any frame.
 */
import { keystrokeFrames } from "../lib/remocn-ui";
import {
  intro,
  logStep,
  logSuccess,
  multiselectPrompt,
  note,
  type Option,
  outro,
  selectPrompt,
  textPrompt,
} from "./clack";
import {
  type Cell,
  COLS,
  chars,
  clipLine,
  type Line,
  lineWidth,
  ROWS,
  s,
} from "./grid";
import { B, DURATION } from "./timeline";

export const PROJECT = "acme-studio";
const COMMAND = "pnpm create astro-stack";
const DEV = "pnpm dev";

// ── Keystrokes ───────────────────────────────────────────────────────────────

export const commandKeys = keystrokeFrames(
  [
    { text: "pnpm ", at: 3, span: 17 },
    { text: "create ", at: 25, span: 27 },
    { text: "astro-stack", at: 57, span: 50 },
  ],
  1.4,
  5,
);

export const nameKeys = keystrokeFrames(
  [
    { text: "acme-", at: 154, span: 20 },
    { text: "studio", at: 180, span: 23 },
  ],
  1.4,
  17,
);

export const devKeys = keystrokeFrames(
  [
    { text: "pnpm ", at: 806, span: 15 },
    { text: "dev", at: 826, span: 8 },
  ],
  1.2,
  29,
);

const typed = (keys: readonly { frame: number }[], t: number): number =>
  keys.filter((k) => k.frame <= t).length;
const lastKeyBefore = (keys: readonly { frame: number }[], t: number): number =>
  keys.filter((k) => k.frame <= t).at(-1)?.frame ?? -Infinity;

// ── Prompts ──────────────────────────────────────────────────────────────────

type Key = { at: number; key: "up" | "down" | "space" };

interface PromptBase {
  id: string;
  message: string;
  appear: number;
  enter: number;
  keys: Key[];
}
interface SelectDef extends PromptBase {
  kind: "select";
  options: Option[];
  initial: number;
}
interface MultiDef extends PromptBase {
  kind: "multi";
  options: Option[];
  initial: boolean[];
}
type PromptDef = SelectDef | MultiDef;

const steps = (key: Key["key"], frames: number[]): Key[] =>
  frames.map((at) => ({ at, key }));

/** Copy is from packages/cli/src/index.ts and the feature catalog. */
export const PROMPTS: PromptDef[] = [
  {
    id: "type",
    kind: "select",
    message: "What are you building?",
    options: [
      { label: "Marketing site" },
      { label: "Client project" },
      { label: "Blog" },
      { label: "Documentation" },
      { label: "Portfolio" },
      { label: "Blank project" },
    ],
    initial: 5,
    appear: B(7) + 1,
    keys: steps("up", [214, 219, 224, 229, 234]),
    enter: B(8),
  },
  {
    id: "pm",
    kind: "select",
    message: "Package manager",
    options: [
      { label: "npm" },
      { label: "pnpm" },
      { label: "Yarn" },
      { label: "Bun" },
    ],
    initial: 1,
    appear: B(8) + 1,
    keys: [],
    enter: B(9),
  },
  {
    id: "agents",
    kind: "multi",
    message: "Agent instructions, press Enter to skip",
    options: [
      { label: "Codex (AGENTS.md)" },
      { label: "Claude Code (CLAUDE.md)" },
    ],
    initial: [false, false],
    appear: B(9) + 1,
    keys: [
      { at: 282, key: "down" },
      { at: B(10), key: "space" },
    ],
    enter: B(11),
  },
  {
    id: "css",
    kind: "select",
    message: "Styling: CSS",
    options: [{ label: "Vanilla CSS" }, { label: "Tailwind CSS" }],
    initial: 0,
    appear: B(11) + 1,
    keys: steps("down", [345]),
    enter: B(12),
  },
  {
    id: "tooling",
    kind: "multi",
    message: "Styling: code-quality tools (Space toggles)",
    options: [{ label: "ESLint" }, { label: "Prettier" }, { label: "Biome" }],
    initial: [true, true, true],
    appear: B(12) + 1,
    keys: [
      { at: B(13), key: "space" },
      { at: 405, key: "down" },
      { at: B(14), key: "space" },
    ],
    enter: B(15),
  },
  {
    id: "content",
    kind: "select",
    message: "Content setup",
    options: [
      { label: "None" },
      { label: "Markdown" },
      { label: "MDX" },
      { label: "Content Collections" },
    ],
    initial: 0,
    appear: B(15) + 1,
    keys: steps("down", [458, 465, 472]),
    enter: B(16),
  },
  {
    id: "cms",
    kind: "select",
    message: "CMS integration",
    options: [
      { label: "None" },
      { label: "Pages CMS", hint: "Git-based editing for Astro content" },
    ],
    initial: 0,
    appear: B(16) + 1,
    keys: steps("down", [494]),
    enter: B(17),
  },
  {
    id: "forms",
    kind: "select",
    message: "Forms integration",
    options: [{ label: "None" }, { label: "Resend" }, { label: "Webhooks" }],
    initial: 0,
    appear: B(17) + 1,
    keys: steps("down", [524]),
    enter: B(18),
  },
  {
    id: "deploy",
    kind: "select",
    message: "Deployment target",
    options: [
      { label: "Static site" },
      { label: "Vercel" },
      { label: "Netlify" },
      { label: "Cloudflare" },
    ],
    initial: 0,
    appear: B(18) + 1,
    keys: steps("down", [550, 559]),
    enter: B(19),
  },
];

export const LAUNCH: SelectDef = {
  id: "launch",
  kind: "select",
  message: "Launch this project?",
  options: [{ label: "Launch project" }, { label: "Cancel" }],
  initial: 0,
  appear: B(22),
  keys: [],
  enter: B(23),
};

export const T = {
  commandEnter: B(4),
  intro: B(4) + 2,
  name: B(5),
  nameEnter: B(7),
  flightPlan: B(19) + 2,
  pullBack: B(20),
  preparing: B(23) + 1,
  packages: B(23) + 4,
  deps: B(24),
  ready: B(25),
  card: B(26),
  outro: B(26) + 20,
  devPrompt: B(26) + 22,
  devEnter: B(28),
  banner: B(28) + 16,
  local: B(29),
  interrupt: B(30) + 15,
  clear: B(31),
} as const;

// ── Cells ────────────────────────────────────────────────────────────────────

export type Row = Cell[];
export const toRow = (line: Line): Row =>
  line.flatMap((seg) =>
    chars(seg.text).map((ch) => ({ ch, style: seg.style })),
  );

/** Characters revealed at `perFrame` from `start`. */
const revealed = (t: number, start: number, perFrame: number): number =>
  t < start ? 0 : Math.floor((t - start) * perFrame) + 1;

interface Block {
  rows: Row[];
  /** This block is the one the camera should frame. */
  focus?: boolean;
}

function promptState(p: PromptDef, t: number) {
  const done = t >= p.enter;
  const pressed = p.keys.filter((k) => k.at <= t);
  const n = p.options.length;
  let cursor = p.kind === "select" ? p.initial : 0;
  const selected = p.kind === "multi" ? [...p.initial] : [];
  for (const k of pressed) {
    if (k.key === "up") cursor = (cursor - 1 + n) % n;
    if (k.key === "down") cursor = (cursor + 1) % n;
    if (k.key === "space") selected[cursor] = !selected[cursor];
  }
  return { done, cursor, selected };
}

function promptBlock(p: PromptDef, t: number): Block | null {
  if (t < p.appear) return null;
  const { done, cursor, selected } = promptState(p, t);
  const lines =
    p.kind === "select"
      ? selectPrompt(p.message, p.options, cursor, done)
      : multiselectPrompt(p.message, p.options, cursor, selected, done);
  return { rows: lines.map(toRow), focus: !done };
}

/**
 * A clack note that draws its border one character at a time along the
 * perimeter, then prints its body one row per `rowFrames`.
 */
function drawnNote(
  title: string,
  body: Line[],
  t: number,
  start: number,
  borderPerFrame: number,
  rowFrames: number,
): Block | null {
  if (t < start) return null;
  const { lines } = note(title, body, COLS);
  const rows = lines.map(toRow);
  const last = rows.length - 1;
  const order: [number, number][] = [[0, 0]];
  for (let c = 0; c < rows[1].length; c++) order.push([1, c]);
  for (let r = 2; r < last; r++) order.push([r, rows[r].length - 1]);
  for (let c = rows[last].length - 1; c >= 0; c--) order.push([last, c]);
  for (let r = last - 1; r >= 2; r--) order.push([r, 0]);
  const drawn = revealed(t, start, borderPerFrame);
  const visible = rows.map((row) => row.map(() => false));
  for (const [r, c] of order.slice(0, drawn)) visible[r][c] = true;
  const bodyStart = start + order.length / borderPerFrame;
  const bodyRows =
    t < bodyStart ? 0 : Math.floor((t - bodyStart) / rowFrames) + 1;
  for (let r = 2; r < last; r++)
    if (r - 2 < bodyRows)
      visible[r] = visible[r].map(
        (v, c) => v || (c > 0 && c < rows[r].length - 1),
      );
  return {
    rows: rows.map((row, r) =>
      row.map((cell, c) => (visible[r][c] ? cell : { ch: " ", style: {} })),
    ),
  };
}

// ── Shell ────────────────────────────────────────────────────────────────────

export const shellPrompt = (dir: string): Line => [
  s(dir, { fg: "cyan", bold: true }),
  s(" "),
  s("❯", { fg: "violet", bold: true }),
  s(" "),
];

export interface Screen {
  /** Exactly ROWS rows of cells (shorter rows are padded by the renderer). */
  rows: Row[];
  /** Block cursor position, or null when hidden. */
  cursor: { row: number; col: number; solid: boolean } | null;
  /** Visible row range of the active block. */
  focus: { from: number; to: number; cols: number };
}

const FLIGHT_PLAN: [string, string][] = [
  ["project", PROJECT],
  ["location", `./${PROJECT}`],
  ["projectType", "marketing"],
  ["packageManager", "pnpm"],
  ["styling", "tailwind; TypeScript (strict), Biome"],
  ["content", "collections"],
  ["cms", "pages"],
  ["forms", "resend"],
  ["deployment", "netlify"],
  ["agents", "claude"],
  ["editors", "none"],
  ["hooks", "none"],
];

/** pnpm 11's install summary for this exact selection (measured locally). */
const DEPENDENCIES: Line[] = [
  [],
  [s("dependencies:", { bold: true })],
  [s("+", { fg: "green" }), s(" resend "), s("6.32.0", { dim: true })],
  [],
  [s("devDependencies:", { bold: true })],
  ...(
    [
      ["@astrojs/check", "0.9.10"],
      ["@astrojs/netlify", "8.2.6"],
      ["@biomejs/biome", "2.5.4"],
      ["@tailwindcss/vite", "4.3.3"],
      ["astro", "7.3.5"],
      ["tailwindcss", "4.3.3"],
      ["typescript", "5.9.3"],
    ] as const
  ).map(
    ([name, version]): Line => [
      s("+", { fg: "green" }),
      s(` ${name} `),
      s(version, { dim: true }),
    ],
  ),
  [],
  [s("Done in 15.5s using pnpm v11.0.8")],
];

const NEXT_STEPS: Line[] = [
  [s("Next steps")],
  [s("1. cd ./acme-studio")],
  [s("2. pnpm dev")],
  [],
  [
    s("Note:", { dim: true }),
    s(
      " Push this project to GitHub, then connect the repository at https://app.pagescms.org.",
    ),
  ],
  [
    s("Note:", { dim: true }),
    s(" Set RESEND_API_KEY in .env before the contact form will work."),
  ],
];

/** Lines printed one per `every` frames from `start`. */
const printed = (
  lines: Line[],
  t: number,
  start: number,
  every: number,
): Row[] =>
  t < start
    ? []
    : lines.slice(0, Math.floor((t - start) / every) + 1).map(toRow);

function sessionBlocks(t: number): {
  blocks: Block[];
  cursor: Screen["cursor"];
} {
  const blocks: Block[] = [];
  const push = (rows: Row[], focus = false) => blocks.push({ rows, focus });

  // Shell command.
  const cmdCount = typed(commandKeys, t);
  push(
    [toRow([...shellPrompt("~/clients"), s(COMMAND.slice(0, cmdCount))])],
    t < T.commandEnter,
  );
  if (t < T.commandEnter) {
    const solid =
      t - lastKeyBefore(commandKeys, t) < 12 && cmdCount < COMMAND.length;
    return {
      blocks,
      cursor: {
        row: 0,
        col: lineWidth(shellPrompt("~/clients")) + cmdCount,
        solid,
      },
    };
  }

  // Intro: `┌  ` at once, the wordmark a character a frame, the tagline two.
  if (t >= T.intro) {
    const wordmarkEnd = 3 + 15;
    const n = Math.min(wordmarkEnd, 3 + revealed(t, T.intro, 1));
    const tail = t >= T.intro + 15 ? revealed(t, T.intro + 15, 2) : 0;
    push([toRow(clipLine(intro, n + tail))]);
  }

  // Project name.
  if (t >= T.name) {
    const count = typed(nameKeys, t);
    const lines = textPrompt(
      {
        message: "Project name",
        placeholder: "my-astro-project",
        value: PROJECT.slice(0, count),
        cursor: true,
      },
      t >= T.nameEnter,
    );
    push(lines.map(toRow), t < T.nameEnter);
  }

  for (const p of PROMPTS) {
    const b = promptBlock(p, t);
    if (b) blocks.push(b);
  }

  // Flight plan: cyan keys, dim colons, violet values.
  const plan = drawnNote(
    "Flight plan",
    FLIGHT_PLAN.map(
      ([k, v]): Line => [
        s(k, { fg: "cyan", bold: true }),
        s(":", { dim: true }),
        s(" "),
        s(v, { fg: "violet", bold: true }),
      ],
    ),
    t,
    T.flightPlan,
    8,
    3,
  );
  if (plan) blocks.push({ ...plan, focus: t < LAUNCH.appear });

  const launch = promptBlock(LAUNCH, t);
  if (launch) blocks.push(launch);

  if (t >= T.preparing)
    push(logStep([s("Preparing your project for launch...")]).map(toRow));

  // pnpm install, streaming through clack's inherited stdout.
  if (t >= T.packages) {
    const barCells = Math.min(80, revealed(t, T.packages + 1, 8));
    const k = Math.min(1, Math.max(0, (t - (T.packages + 2)) / 20));
    // pnpm counts resolved and downloaded packages, then links them all at once.
    const progress =
      t >= T.packages + 2
        ? `Progress: resolved ${Math.round(961 * k)}, reused 0, downloaded ${Math.round(796 * k)}, added ${k >= 1 ? "793, done" : "0"}`
        : "";
    push(
      [
        toRow([s("Packages: "), s("+793", { fg: "green" })]),
        toRow([s("+".repeat(barCells), { fg: "green" })]),
        ...(progress ? [toRow([s(progress)])] : []),
      ],
      t < T.ready,
    );
  }
  push(printed(DEPENDENCIES, t, T.deps, 2), t >= T.deps && t < T.ready);

  if (t >= T.ready)
    push(
      logSuccess([
        s("✦ PROJECT READY ✦", { fg: "peach", bold: true }),
        s("  "),
        s(PROJECT, { fg: "violet", bold: true }),
        s(" is ready for liftoff."),
      ]).map(toRow),
      t < T.card,
    );

  const card = drawnNote("Your Astro project", NEXT_STEPS, t, T.card, 10, 1);
  if (card) blocks.push({ ...card, focus: t < T.devPrompt });

  if (t >= T.outro)
    push(outro("The stars are aligned. Start building.").map(toRow));

  if (t < T.devPrompt) return { blocks, cursor: null };

  // `pnpm dev` from the project directory.
  const devCount = typed(devKeys, t);
  const devLine = [
    ...shellPrompt(`~/clients/${PROJECT}`),
    s(DEV.slice(0, devCount)),
  ];
  push([toRow(devLine)], t < T.devEnter);
  if (t < T.devEnter) {
    const solid = t - lastKeyBefore(devKeys, t) < 12 && devCount < DEV.length;
    return { blocks, cursor: { row: -1, col: lineWidth(devLine), solid } };
  }

  push([
    [],
    toRow([s(`> ${PROJECT}@0.0.0 dev /home/you/clients/${PROJECT}`)]),
    toRow([s("> astro dev")]),
  ]);
  if (t >= T.banner)
    push([
      [],
      toRow([
        s(" astro ", { bold: true, bg: "greenBg" }),
        s(" "),
        s("v7.3.5", { fg: "green" }),
        s(" "),
        s("ready in", { dim: true }),
        s(" 386 "),
        s("ms", { dim: true }),
      ]),
      [],
    ]);
  if (t >= T.local)
    push(
      [
        toRow([
          s("┃", { dim: true }),
          s(" Local    "),
          s("http://localhost:4321/", { fg: "cyan" }),
        ]),
        ...(t >= T.local + 3
          ? [
              toRow([
                s("┃", { dim: true }),
                s(" Network  "),
                s("use --host to expose", { dim: true }),
              ]),
            ]
          : []),
      ],
      true,
    );
  if (t >= T.interrupt) push([[], toRow([s("^C")])]);
  return { blocks, cursor: null };
}

/** The terminal at frame `t`: last ROWS rows of the transcript. */
export function screenAt(frame: number): Screen {
  const t = ((frame % DURATION) + DURATION) % DURATION;

  if (t >= T.clear) {
    const prompt = shellPrompt("~/clients");
    return {
      rows: [toRow(prompt)],
      cursor: { row: 0, col: lineWidth(prompt), solid: false },
      focus: { from: 0, to: 0, cols: 40 },
    };
  }

  const { blocks, cursor } = sessionBlocks(t);
  const all: Row[] = [];
  let focus = { from: 0, to: 0, cols: 40 };
  for (const b of blocks) {
    if (b.focus && b.rows.length) {
      focus = {
        from: all.length,
        to: all.length + b.rows.length - 1,
        cols: Math.max(...b.rows.map((r) => r.length)),
      };
    }
    all.push(...b.rows);
  }
  // The cursor sits on the line after the output when the shell owns it.
  const offset = Math.max(0, all.length - ROWS);
  const rows = all.slice(offset);
  const shift = (r: number) => r - offset;
  let shownCursor: Screen["cursor"] = null;
  if (cursor) {
    const row = cursor.row < 0 ? all.length - 1 : cursor.row;
    shownCursor = { ...cursor, row: shift(row) };
  }
  return {
    rows,
    cursor: shownCursor,
    focus: {
      from: Math.max(0, shift(focus.from)),
      to: Math.max(0, shift(focus.to)),
      cols: focus.cols,
    },
  };
}
