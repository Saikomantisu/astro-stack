/**
 * Line-for-line renders of @clack/prompts 1.7 (withGuide on), using the same
 * symbols, colours and ANSI weights the real CLI prints.
 */
import { chars, type Line, lineWidth, type Seg, s } from "./grid";

const bar = (color: "gray" | "cyan" = "gray"): Seg => s("│", { fg: color });
const gap = s("  ");
const dim = (text: string): Seg => s(text, { dim: true });

export const guide: Line = [bar()];

/** `┌  ✦ astro stack ✦ — Set your coordinates.` (brand.ts astroStackWordmark). */
export const intro: Line = [
  s("┌", { fg: "gray" }),
  gap,
  s("✦", { fg: "peach", bold: true }),
  s(" "),
  s("astro", { fg: "violet", bold: true }),
  s(" "),
  dim("stack"),
  s(" "),
  s("✦", { fg: "peach", bold: true }),
  s(" — Set your coordinates."),
];

const activeHeader = (message: string): Line[] => [
  guide,
  [s("◆", { fg: "cyan" }), gap, s(message)],
];
const submitted = (message: string, value: Seg[]): Line[] => [
  guide,
  [s("◇", { fg: "green" }), gap, s(message)],
  [bar(), gap, ...value],
];

export interface TextState {
  message: string;
  placeholder: string;
  value: string;
  /** Show clack's inverse-cell cursor after the input. */
  cursor: boolean;
}

export function textPrompt(p: TextState, done: boolean): Line[] {
  if (done) return submitted(p.message, [dim(p.value)]);
  const input: Seg[] = p.value
    ? [s(p.value), ...(p.cursor ? [s(" ", { inverse: true })] : [])]
    : [s(p.placeholder[0], { inverse: true }), dim(p.placeholder.slice(1))];
  return [
    ...activeHeader(p.message),
    [bar("cyan"), gap, ...input],
    [s("└", { fg: "cyan" })],
  ];
}

export interface Option {
  label: string;
  hint?: string;
}

const footer = (parts: [string, string][]): Line[] => [
  [
    bar("cyan"),
    gap,
    ...parts.flatMap(([key, rest], i) => [
      ...(i > 0 ? [s(" • ")] : []),
      dim(key),
      s(rest),
    ]),
  ],
  [s("└", { fg: "cyan" })],
];

export function selectPrompt(
  message: string,
  options: Option[],
  cursor: number,
  done: boolean,
): Line[] {
  if (done) return submitted(message, [dim(options[cursor].label)]);
  return [
    ...activeHeader(message),
    ...options.map(
      (o, i): Line =>
        i === cursor
          ? [
              bar("cyan"),
              gap,
              s("●", { fg: "green" }),
              s(` ${o.label}`),
              ...(o.hint ? [s(" "), dim(`(${o.hint})`)] : []),
            ]
          : [bar("cyan"), gap, dim("○"), s(" "), dim(o.label)],
    ),
    ...footer([
      ["↑/↓", " to navigate"],
      ["Enter:", " confirm"],
    ]),
  ];
}

export function multiselectPrompt(
  message: string,
  options: Option[],
  cursor: number,
  selected: boolean[],
  done: boolean,
): Line[] {
  if (done) {
    const picked = options.filter((_, i) => selected[i]);
    const value: Seg[] = picked.length
      ? picked.flatMap((o, i) => [...(i > 0 ? [dim(", ")] : []), dim(o.label)])
      : [dim("none")];
    return submitted(message, value);
  }
  return [
    ...activeHeader(message),
    ...options.map((o, i): Line => {
      const active = i === cursor;
      const on = selected[i];
      const box = on
        ? s("◼", { fg: "green" })
        : s("◻", active ? { fg: "cyan" } : { dim: true });
      const label = active ? s(` ${o.label}`) : dim(` ${o.label}`);
      return [bar("cyan"), gap, box, label];
    }),
    ...footer([
      ["↑/↓", " to navigate"],
      ["Space:", " select"],
      ["Enter:", " confirm"],
    ]),
  ];
}

/** clack `log.step` / `log.success`: a guide line, then the symbol and text. */
export const logStep = (text: Seg[]): Line[] => [
  guide,
  [s("◇", { fg: "green" }), gap, ...text],
];
export const logSuccess = (text: Seg[]): Line[] => [
  guide,
  [s("◆", { fg: "green" }), gap, ...text],
];

export const outro = (text: string): Line[] => [
  guide,
  [s("└", { fg: "gray" }), gap, s(text)],
  [],
];

/** Word wrap at `width` columns, like clack's hard wrap for notes. */
function wrap(line: Line, width: number): Line[] {
  if (lineWidth(line) <= width) return [line];
  const out: Line[] = [];
  let current: Line = [];
  let used = 0;
  for (const seg of line) {
    for (const word of seg.text.split(/(?<= )/)) {
      const w = chars(word).length;
      if (used + w > width && used > 0) {
        out.push(current);
        current = [];
        used = 0;
      }
      current.push({ text: word, style: seg.style });
      used += w;
    }
  }
  if (current.length) out.push(current);
  return out.map((l) => {
    // Drop the trailing break space so it doesn't widen the box.
    const last = l[l.length - 1];
    if (last?.text.endsWith(" "))
      l[l.length - 1] = { ...last, text: last.text.trimEnd() };
    return l;
  });
}

export interface NoteLayout {
  lines: Line[];
  /** Index of the first body row and the box's inner width. */
  bodyStart: number;
  width: number;
}

/** clack `note(body, title)`: a titled box hung off the guide. */
export function note(title: string, body: Line[], columns: number): NoteLayout {
  const rows = [[], ...body.flatMap((l) => wrap(l, columns - 6)), []];
  const n = chars(title).length;
  const t = Math.max(...rows.map(lineWidth), n) + 2;
  const lines: Line[] = [
    guide,
    [
      s("◇", { fg: "green" }),
      gap,
      s(title),
      s(" "),
      s(`${"─".repeat(Math.max(t - n - 1, 1))}╮`, { fg: "gray" }),
    ],
    ...rows.map(
      (r): Line => [bar(), gap, ...r, s(" ".repeat(t - lineWidth(r))), bar()],
    ),
    [s(`├${"─".repeat(t + 2)}╯`, { fg: "gray" })],
  ];
  return { lines, bodyStart: 2, width: t };
}
