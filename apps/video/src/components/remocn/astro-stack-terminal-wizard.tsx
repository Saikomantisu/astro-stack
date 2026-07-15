import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Caret } from "./caret";

const palette = {
  background: "#1a1b28",
  foreground: "#cbd3ff",
  muted: "#858ba8",
  rail: "#4b5278",
  violet: "#bd92f8",
  cyan: "#78cbff",
  lime: "#a7dc6b",
  peach: "#f2bd71",
} as const;

const timeline = {
  command: 10,
  intro: 70,
  project: 96,
  directory: 166,
  type: 236,
  manager: 336,
  agents: 416,
  editors: 496,
  hooks: 576,
  css: 656,
  typescript: 736,
  tooling: 816,
  content: 906,
  forms: 996,
  deployment: 1086,
  summary: 1176,
  launch: 1250,
  generate: 1280,
  ready: 1310,
} as const;

type WizardPrompt = {
  label: string;
  value: string;
  start: number;
  mode: "input" | "select" | "multiselect";
  options?: readonly string[];
  initial?: string;
  selections?: readonly string[];
};

const prompts: readonly WizardPrompt[] = [
  {
    label: "Project name",
    value: "my-website",
    start: timeline.project,
    mode: "input",
  },
  {
    label: "Where should it be created?",
    value: "./my-website",
    start: timeline.directory,
    mode: "input",
  },
  {
    label: "What are you building?",
    value: "Marketing site",
    start: timeline.type,
    mode: "select",
    initial: "Blank project",
    options: [
      "Marketing site",
      "Client project",
      "Blog",
      "Documentation",
      "Portfolio",
      "SaaS landing page",
      "Blank project",
    ],
  },
  {
    label: "Package manager",
    value: "pnpm",
    start: timeline.manager,
    mode: "select",
    initial: "pnpm",
    options: ["npm", "pnpm", "Yarn", "Bun"],
  },
  {
    label: "Agent instructions (optional — Enter to skip)",
    value: "Codex (AGENTS.md)",
    start: timeline.agents,
    mode: "multiselect",
    options: ["Codex (AGENTS.md)", "Claude Code (CLAUDE.md)"],
  },
  {
    label: "Editor integration (optional — Enter to skip)",
    value: "Zed",
    start: timeline.editors,
    mode: "multiselect",
    options: ["VS Code", "Cursor", "Zed"],
  },
  {
    label: "Set up a pre-commit hook?",
    value: "No",
    start: timeline.hooks,
    mode: "select",
    initial: "No",
    options: ["Yes — run safe fixes and project checks", "No"],
  },
  {
    label: "Styling: CSS",
    value: "Tailwind CSS",
    start: timeline.css,
    mode: "select",
    initial: "Vanilla CSS",
    options: ["Vanilla CSS", "Tailwind CSS"],
  },
  {
    label: "Styling: TypeScript",
    value: "Strict (recommended)",
    start: timeline.typescript,
    mode: "select",
    initial: "Strict (recommended)",
    options: ["Strict (recommended)", "Relaxed"],
  },
  {
    label: "Styling: code-quality tools (Space toggles)",
    value: "ESLint, Prettier, Biome",
    start: timeline.tooling,
    mode: "multiselect",
    selections: ["ESLint", "Prettier", "Biome"],
    options: ["ESLint", "Prettier", "Biome"],
  },
  {
    label: "Content setup",
    value: "Content Collections",
    start: timeline.content,
    mode: "select",
    initial: "None",
    options: ["None", "Markdown", "MDX", "Content Collections"],
  },
  {
    label: "Forms integration",
    value: "None",
    start: timeline.forms,
    mode: "select",
    initial: "None",
    options: ["None", "Resend", "Webhooks"],
  },
  {
    label: "Deployment target",
    value: "Static site",
    start: timeline.deployment,
    mode: "select",
    initial: "Static site",
    options: ["Static site", "Vercel", "Netlify", "Cloudflare"],
  },
] as const;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function AstroStackTerminalWizard() {
  const frame = useCurrentFrame();
  const currentIndex = findCurrentPrompt(frame);
  const scrollY = getScrollY(frame);

  return (
    <div style={styles.canvas}>
      <div style={styles.terminal}>
        <TerminalChrome />
        <div style={styles.viewport}>
          <div
            style={{ ...styles.buffer, transform: `translateY(${scrollY}px)` }}
          >
            <CommandLine frame={frame} />
            {frame >= timeline.intro && <Wordmark frame={frame} />}
            {prompts.map((prompt, index) => {
              if (frame < prompt.start) return null;
              return (
                <Prompt
                  key={prompt.label}
                  prompt={prompt}
                  frame={frame}
                  active={index === currentIndex && frame < timeline.summary}
                  complete={index < currentIndex || frame >= timeline.summary}
                />
              );
            })}
            {frame >= timeline.summary && <Summary frame={frame} />}
            {frame >= timeline.launch && <LaunchPrompt frame={frame} />}
            {frame >= timeline.generate && <Generation frame={frame} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalChrome() {
  return (
    <div style={styles.titleBar}>
      <div style={styles.trafficLights}>
        <span style={{ ...styles.trafficLight, background: "#d94f4f" }} />
        <span style={{ ...styles.trafficLight, background: palette.peach }} />
        <span style={{ ...styles.trafficLight, background: palette.lime }} />
      </div>
      <div style={styles.windowTitle}>astro-stack — zsh</div>
    </div>
  );
}

function CommandLine({ frame }: { frame: number }) {
  const command = "pnpm create astro-stack";
  const visible = typedText(command, frame, timeline.command, 1.35);
  const done = visible.length === command.length;

  return (
    <div style={styles.commandLine}>
      <span style={{ color: palette.lime, marginRight: 14 }}>❯</span>
      <span>{visible}</span>
      {!done && <Caret color={palette.cyan} height={30} width={13} />}
    </div>
  );
}

function Wordmark({ frame }: { frame: number }) {
  const progress = entrance(frame - timeline.intro);
  return (
    <div
      style={{
        ...styles.wordmark,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 8}px)`,
      }}
    >
      <span style={{ color: palette.peach }}>✦</span>{" "}
      <span style={{ color: palette.violet, fontWeight: 700 }}>astro</span>{" "}
      <span style={{ color: palette.muted }}>stack</span>{" "}
      <span style={{ color: palette.peach }}>✦</span>{" "}
      <span>— Set your coordinates.</span>
    </div>
  );
}

function Prompt({
  prompt,
  frame,
  active,
  complete,
}: {
  prompt: WizardPrompt;
  frame: number;
  active: boolean;
  complete: boolean;
}) {
  const local = frame - prompt.start;
  const progress = entrance(local);
  const selected =
    local < 28 && prompt.initial
      ? [prompt.initial]
      : (prompt.selections ?? [prompt.value]);

  return (
    <div
      style={{
        ...styles.prompt,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 10}px)`,
      }}
    >
      <Rail active={active} complete={complete} />
      <div style={styles.promptBody}>
        <div style={styles.promptLabel}>{prompt.label}</div>
        {complete ? (
          <div style={styles.completeValue}>{prompt.value}</div>
        ) : prompt.mode === "input" ? (
          <TypedValue value={prompt.value} localFrame={local} />
        ) : (
          <OptionList
            options={prompt.options ?? []}
            selected={selected}
            multiple={prompt.mode === "multiselect"}
            showSelection={local >= 28}
          />
        )}
      </div>
    </div>
  );
}

function Rail({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <div style={styles.railColumn}>
      <span
        style={{
          ...styles.diamond,
          background: active ? palette.cyan : "transparent",
          border: complete ? `2px solid ${palette.lime}` : "none",
        }}
      />
      <span
        style={{
          ...styles.rail,
          background: active ? palette.cyan : palette.rail,
        }}
      />
    </div>
  );
}

function TypedValue({
  value,
  localFrame,
}: {
  value: string;
  localFrame: number;
}) {
  const typed = typedText(value, localFrame, 15, 1.15);
  const done = typed.length === value.length;
  return (
    <div
      style={{
        ...styles.inputValue,
        color: done ? palette.foreground : palette.foreground,
      }}
    >
      {typed}
      <Caret
        color={palette.foreground}
        height={30}
        width={13}
        blink={done}
        blinkPerSecond={1}
        marginLeft={2}
      />
    </div>
  );
}

function OptionList({
  options,
  selected,
  multiple,
  showSelection,
}: {
  options: readonly string[];
  selected: readonly string[];
  multiple: boolean;
  showSelection: boolean;
}) {
  return (
    <div style={styles.optionList}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const mark = multiple
          ? isSelected && showSelection
            ? "■"
            : "□"
          : isSelected
            ? "●"
            : "○";
        return (
          <div
            key={option}
            style={{
              ...styles.option,
              color: isSelected ? palette.foreground : palette.muted,
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            <span
              style={{
                color:
                  isSelected && showSelection ? palette.lime : palette.muted,
                display: "inline-block",
                width: 38,
              }}
            >
              {mark}
            </span>
            {option}
          </div>
        );
      })}
      <div style={styles.help}>
        ↑/↓ to navigate · {multiple && "Space: select · "}Enter:{" "}
        <span style={{ color: palette.foreground }}>confirm</span>
      </div>
    </div>
  );
}

function Summary({ frame }: { frame: number }) {
  const rows = [
    ["project", "my-website"],
    ["location", "./my-website"],
    ["projectType", "marketing"],
    ["packageManager", "pnpm"],
    ["styling", "tailwind; TypeScript (strict), ESLint, Prettier, Biome"],
    ["content", "collections"],
    ["forms", "none"],
    ["deployment", "static"],
    ["agents", "codex"],
    ["editors", "zed"],
    ["hooks", "none"],
  ] as const;

  return (
    <div style={styles.summary}>
      <Rail
        active={frame < timeline.launch}
        complete={frame >= timeline.launch}
      />
      <div style={styles.promptBody}>
        <div style={styles.promptLabel}>Flight plan</div>
        <div style={styles.manifest}>
          {rows.map(([label, value], index) => {
            const progress = entrance(frame - timeline.summary - index * 3);
            return (
              <div
                key={label}
                style={{ ...styles.manifestRow, opacity: progress }}
              >
                <span style={{ color: palette.cyan }}>{label}</span>
                <span style={{ color: palette.muted }}>: </span>
                <span style={{ color: palette.violet }}>{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LaunchPrompt({ frame }: { frame: number }) {
  const complete = frame >= timeline.generate;
  return (
    <div style={styles.prompt}>
      <Rail active={!complete} complete={complete} />
      <div style={styles.promptBody}>
        <div style={styles.promptLabel}>Launch this project?</div>
        <div style={complete ? styles.completeValue : styles.option}>
          <span
            style={{ color: palette.lime, display: "inline-block", width: 38 }}
          >
            ●
          </span>
          Launch project
        </div>
      </div>
    </div>
  );
}

function Generation({ frame }: { frame: number }) {
  const lines = [
    "Creating project files...",
    "Installing selected dependencies...",
    "Running project checks...",
  ];
  return (
    <div style={styles.generation}>
      {lines.map((line, index) => {
        const start = timeline.generate + index * 6;
        if (frame < start) return null;
        return (
          <div key={line} style={{ color: palette.muted, lineHeight: 1.55 }}>
            {frame >= start + 5 ? "◇" : "◆"} {line}
          </div>
        );
      })}
      {frame >= timeline.ready && (
        <div style={{ color: palette.peach, fontWeight: 700, marginTop: 10 }}>
          ✦ PROJECT READY ✦{" "}
          <span style={{ color: palette.violet }}>my-website</span>{" "}
          <span style={{ color: palette.foreground, fontWeight: 500 }}>
            is ready for liftoff.
          </span>
        </div>
      )}
    </div>
  );
}

function findCurrentPrompt(frame: number): number {
  let index = -1;
  for (let i = 0; i < prompts.length; i++) {
    if (frame >= prompts[i].start) index = i;
  }
  return index;
}

function getScrollY(frame: number): number {
  if (frame >= timeline.generate) return -1690;
  if (frame >= timeline.launch) return -1420;
  if (frame >= timeline.summary) return -1130;
  const current = findCurrentPrompt(frame);
  if (current < 0) return 0;
  return -Math.max(0, 144 + current * 90 - 235);
}

function typedText(
  text: string,
  frame: number,
  start: number,
  charsPerFrame: number,
): string {
  const count = Math.max(0, Math.floor((frame - start) * charsPerFrame));
  return text.slice(0, count);
}

function entrance(localFrame: number): number {
  return interpolate(localFrame, [0, 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
}

const baseText: CSSProperties = {
  color: palette.foreground,
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: 25,
};

const styles: Record<string, CSSProperties> = {
  canvas: {
    alignItems: "center",
    background: "#0f0b14",
    display: "flex",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  terminal: {
    ...baseText,
    background: palette.background,
    border: `1px solid ${palette.rail}`,
    borderRadius: 14,
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
    height: 650,
    overflow: "hidden",
    width: 1180,
  },
  titleBar: {
    alignItems: "center",
    background: "#222332",
    borderBottom: `1px solid ${palette.rail}`,
    display: "flex",
    height: 44,
    justifyContent: "center",
    position: "relative",
  },
  trafficLights: {
    display: "flex",
    gap: 9,
    left: 16,
    position: "absolute",
  },
  trafficLight: {
    borderRadius: "50%",
    height: 11,
    width: 11,
  },
  windowTitle: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: 500,
  },
  viewport: {
    height: 606,
    overflow: "hidden",
    position: "relative",
  },
  buffer: {
    left: 0,
    padding: "34px 48px 52px",
    position: "absolute",
    right: 0,
    top: 0,
  },
  commandLine: {
    alignItems: "center",
    display: "flex",
    fontSize: 28,
    height: 44,
  },
  wordmark: {
    fontSize: 25,
    margin: "22px 0 30px",
  },
  prompt: {
    display: "flex",
    gap: 20,
    minHeight: 90,
  },
  railColumn: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    width: 18,
  },
  diamond: {
    height: 12,
    marginTop: 7,
    transform: "rotate(45deg)",
    width: 12,
  },
  rail: {
    flex: 1,
    marginTop: 9,
    minHeight: 50,
    width: 2,
  },
  promptBody: {
    flex: 1,
    paddingBottom: 24,
  },
  promptLabel: {
    color: palette.foreground,
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  inputValue: {
    alignItems: "center",
    display: "flex",
    fontSize: 27,
    lineHeight: 1.3,
    marginTop: 7,
    minHeight: 36,
  },
  completeValue: {
    color: palette.muted,
    fontSize: 26,
    lineHeight: 1.3,
    marginTop: 7,
  },
  optionList: {
    marginTop: 7,
  },
  option: {
    color: palette.foreground,
    fontSize: 25,
    lineHeight: 1.4,
  },
  help: {
    color: palette.muted,
    fontSize: 21,
    marginTop: 8,
  },
  summary: {
    display: "flex",
    gap: 20,
    minHeight: 420,
  },
  manifest: {
    border: `1px solid ${palette.rail}`,
    borderRadius: 8,
    marginTop: 14,
    padding: "20px 24px",
  },
  manifestRow: {
    fontSize: 23,
    fontWeight: 600,
    lineHeight: 1.42,
  },
  generation: {
    fontSize: 23,
    marginLeft: 38,
    padding: "6px 0 34px",
  },
};
