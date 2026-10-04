import type { CSSProperties } from "react";
import { springs } from "../lib/remocn-ui";
import { color, font } from "../shared/theme";
import { after, mixColor, presence } from "./motion";

export interface Word {
  text: string;
  /** Frame the word starts setting in. */
  at: number;
  /** Frame the word turns accent purple (optional). */
  accentAt?: number;
}

/**
 * A headline that sets in word by word: each word rises a little, clears a
 * blur and fades up on its own beat, then the line leaves together.
 */
export function Kinetic({
  frame,
  words,
  exitAt = Infinity,
  size = 96,
  weight = 600,
  tracking = -0.04,
  ink = color.ink,
  style,
}: {
  frame: number;
  words: Word[];
  exitAt?: number;
  size?: number;
  weight?: number;
  tracking?: number;
  ink?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: font.sans,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: `${tracking}em`,
        whiteSpace: "pre",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = presence(frame, w.at, exitAt + i * 1.5, springs.swift);
        if (p.v <= 0.001)
          return (
            <span
              key={`${w.text}@${w.at}`}
              style={{ opacity: 0 }}
            >{`${w.text} `}</span>
          );
        const rise = (1 - p.enter) * 0.42 - p.exit * 0.3;
        const blur = (1 - p.v) * 14;
        const accent =
          w.accentAt === undefined
            ? 0
            : after(frame, w.accentAt, springs.morph);
        return (
          <span
            key={`${w.text}@${w.at}`}
            style={{
              display: "inline-block",
              opacity: p.v ** 1.3,
              transform: `translateY(${rise}em)`,
              filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              color: mixColor(ink, color.accent, accent),
            }}
          >
            {w.text}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
}

/** Words of `text` set in one per `step` frames from `at`. */
export const wordsFrom = (text: string, at: number, step: number): Word[] =>
  text.split(" ").map((t, i) => ({ text: t, at: at + i * step }));
