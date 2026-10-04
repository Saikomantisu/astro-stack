import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cameraAt } from "./camera";
import { mono } from "./font";
import {
  CELL_H,
  CELL_W,
  type Cell,
  FONT_SIZE,
  PAD,
  palette,
  SIZE,
  type Style,
} from "./grid";
import { screenAt } from "./session";
import { DURATION } from "./timeline";

const W = CELL_W;
const H = CELL_H;

/** Text colour and background for a cell's ANSI style. */
function ink(style: Style): {
  color: string;
  background?: string;
  opacity: number;
} {
  const fg = style.fg
    ? palette[style.fg]
    : style.dim
      ? palette.dim
      : palette.foreground;
  const opacity = style.dim && style.fg ? 0.6 : 1;
  if (style.inverse)
    return { color: palette.background, background: fg, opacity: 1 };
  return {
    color: fg,
    background: style.bg ? palette[style.bg] : undefined,
    opacity,
  };
}

/**
 * Geometric symbols Geist Mono doesn't carry, and box drawing, are drawn to
 * fill their cell the way terminal emulators do, so the glyph set stays one
 * consistent weight and gutters join without gaps.
 */
function vector(ch: string, color: string, bold: boolean): ReactNode | null {
  const cx = W / 2;
  const cy = H / 2;
  const line = 1.6;
  const heavy = 3.2;
  const stroke = {
    stroke: color,
    strokeWidth: line,
    fill: "none",
    strokeLinecap: "square" as const,
  };
  switch (ch) {
    case "│":
      return <path d={`M${cx} 0V${H}`} {...stroke} />;
    case "┃":
      return <path d={`M${cx} 0V${H}`} {...stroke} strokeWidth={heavy} />;
    case "─":
      return <path d={`M0 ${cy}H${W}`} {...stroke} />;
    case "┌":
      return <path d={`M${W} ${cy}H${cx}V${H}`} {...stroke} />;
    case "└":
      return <path d={`M${cx} 0V${cy}H${W}`} {...stroke} />;
    case "├":
      return <path d={`M${cx} 0V${H}M${cx} ${cy}H${W}`} {...stroke} />;
    case "╮":
      return (
        <path
          d={`M0 ${cy}H${cx - 5}Q${cx} ${cy} ${cx} ${cy + 5}V${H}`}
          {...stroke}
        />
      );
    case "╯":
      return (
        <path
          d={`M${cx} 0V${cy - 5}Q${cx} ${cy} ${cx - 5} ${cy}H0`}
          {...stroke}
        />
      );
    case "◆":
      return (
        <path
          d={`M${cx} ${cy - 6.5}L${cx + 6.5} ${cy}L${cx} ${cy + 6.5}L${cx - 6.5} ${cy}Z`}
          fill={color}
        />
      );
    case "◇":
      return (
        <path
          d={`M${cx} ${cy - 6}L${cx + 6} ${cy}L${cx} ${cy + 6}L${cx - 6} ${cy}Z`}
          {...stroke}
          strokeLinejoin="miter"
        />
      );
    case "●":
      return <circle cx={cx} cy={cy} r={4.6} fill={color} />;
    case "○":
      return <circle cx={cx} cy={cy} r={4.4} {...stroke} />;
    case "◼":
      return (
        <rect x={cx - 5.5} y={cy - 5.5} width={11} height={11} fill={color} />
      );
    case "◻":
      return <rect x={cx - 5} y={cy - 5} width={10} height={10} {...stroke} />;
    case "✦":
      return (
        <path
          d={`M${cx} ${cy - 7}C${cx + 0.8} ${cy - 2} ${cx + 2} ${cy - 0.8} ${cx + 7} ${cy}C${cx + 2} ${cy + 0.8} ${cx + 0.8} ${cy + 2} ${cx} ${cy + 7}C${cx - 0.8} ${cy + 2} ${cx - 2} ${cy + 0.8} ${cx - 7} ${cy}C${cx - 2} ${cy - 0.8} ${cx - 0.8} ${cy - 2} ${cx} ${cy - 7}Z`}
          fill={color}
        />
      );
    case "❯":
      return (
        <path
          d={`M${cx - 3.5} ${cy - 6}L${cx + 3} ${cy}L${cx - 3.5} ${cy + 6}`}
          {...stroke}
          strokeWidth={bold ? 2.6 : 1.8}
          strokeLinejoin="miter"
          strokeLinecap="butt"
        />
      );
    default:
      return null;
  }
}

export function CellView({
  cell,
  row,
  col,
  pad = PAD,
}: {
  cell: Cell;
  row: number;
  col: number;
  /** Inset of the grid's first cell inside its layer. */
  pad?: number;
}) {
  const { color, background, opacity } = ink(cell.style);
  const box: CSSProperties = {
    position: "absolute",
    left: pad + col * W,
    top: pad + row * H,
    width: W,
    height: H,
    background,
    opacity,
  };
  const shape = vector(cell.ch, color, !!cell.style.bold);
  if (shape) {
    return (
      <svg
        style={box}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        {shape}
      </svg>
    );
  }
  if (cell.ch === " " && !background) return null;
  return (
    <div
      style={{
        ...box,
        color,
        fontFamily: mono,
        fontSize: FONT_SIZE,
        lineHeight: `${H}px`,
        fontWeight: cell.style.bold ? 700 : 400,
        whiteSpace: "pre",
        overflow: "visible",
      }}
    >
      {cell.ch}
    </div>
  );
}

/** Block cursor that blinks on the beat: on for the first half of each beat. */
const blinkOn = (frame: number) => ((frame % 30) + 30) % 30 < 15;

export function Terminal() {
  const frame = ((useCurrentFrame() % DURATION) + DURATION) % DURATION;
  const screen = screenAt(frame);
  const cam = cameraAt(frame);
  const cursor = screen.cursor;
  return (
    <AbsoluteFill style={{ background: palette.background }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SIZE,
          height: SIZE,
          transformOrigin: "0 0",
          transform: `translate(${SIZE / 2}px, ${SIZE / 2}px) scale(${cam.scale}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {screen.rows.flatMap((row, r) =>
          row.map((cell, c) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a cell's identity is its grid position.
            <CellView key={`${r}:${c}`} cell={cell} row={r} col={c} />
          )),
        )}
        {cursor && (cursor.solid || blinkOn(frame)) ? (
          <div
            style={{
              position: "absolute",
              left: PAD + cursor.col * W,
              top: PAD + cursor.row * H + 2,
              width: W,
              height: H - 4,
              background: palette.foreground,
            }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
