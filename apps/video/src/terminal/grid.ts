/**
 * The character grid. Every glyph lives in one cell; positions are rows and
 * columns, converted to pixels only when drawing. Cell sizes are integers so
 * cells land on whole pixels in the unscaled layer.
 */

export const SIZE = 1440;
export const FONT_SIZE = 25;
/** Geist Mono advances 0.6 em, so a 25 px font is exactly 15 px wide. */
export const CELL_W = 15;
export const CELL_H = 30;
export const PAD = 45;
export const COLS = (SIZE - PAD * 2) / CELL_W;
export const ROWS = (SIZE - PAD * 2) / CELL_H;

/** The CLI's palette, mapped from the ANSI styles it uses. */
export const palette = {
  background: "#0b0b0f",
  foreground: "#E8E6EF",
  gray: "#64626F",
  dim: "#8C8A96",
  violet: "#BF9BFF",
  peach: "#FFC38E",
  cyan: "#7DD6E8",
  green: "#86D69B",
  greenBg: "#3F9A5C",
} as const;

export type Color = keyof typeof palette;

export interface Style {
  fg?: Color;
  bold?: boolean;
  /** ANSI dim (faint): the colour drawn at reduced intensity. */
  dim?: boolean;
  inverse?: boolean;
  bg?: Color;
}

export interface Seg {
  text: string;
  style: Style;
}

export type Line = Seg[];

export const s = (text: string, style: Style = {}): Seg => ({ text, style });

/** Characters on a line, by code point. */
export const chars = (text: string): string[] => [...text];

export const lineWidth = (line: Line): number =>
  line.reduce((n, seg) => n + chars(seg.text).length, 0);

/** Keep only the first `count` characters of a line. */
export function clipLine(line: Line, count: number): Line {
  const out: Line = [];
  let left = count;
  for (const seg of line) {
    if (left <= 0) break;
    const c = chars(seg.text);
    out.push({ text: c.slice(0, left).join(""), style: seg.style });
    left -= c.length;
  }
  return out;
}

export interface Cell {
  ch: string;
  style: Style;
}
