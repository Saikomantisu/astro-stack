import type { CSSProperties } from "react";
import { springs } from "../lib/remocn-ui";
import { Check } from "../shared/icons";
import { color, font, shadow } from "../shared/theme";
import { Kinetic } from "./Kinetic";
import { after, mix, mixColor, presence, swapStyle } from "./motion";
import { B, H } from "./timeline";

/** Real option labels from the CLI's feature catalog. */
const GROUPS = [
  { label: "Styling", options: ["Tailwind CSS", "Vanilla CSS"], picks: [0] },
  {
    label: "Content",
    options: ["Markdown", "MDX", "Content Collections"],
    picks: [2],
  },
  { label: "CMS", options: ["Pages CMS", "None"], picks: [0] },
  { label: "Forms", options: ["Resend", "Webhooks"], picks: [0] },
  {
    label: "Deploy",
    options: ["Static site", "Vercel", "Netlify", "Cloudflare"],
    picks: [2],
  },
  {
    label: "Tooling",
    options: ["Biome", "ESLint", "Prettier", "Claude Code", "Codex"],
    picks: [0, 3],
  },
];

const COL_W = 270;
const COL_GAP = 22;
const X0 = (1920 - (GROUPS.length * COL_W + (GROUPS.length - 1) * COL_GAP)) / 2;
const GRID_TOP = 360;
const CARD_H = 70;
const CARD_GAP = 14;

/** Columns rise one per beat, then one group is picked per beat. */
const riseAt = (g: number) => B(30 + g);
const pickAt = (g: number, k: number) => B(36 + g) + k * 15;
const GRID_EXIT = B(44);

/** The tidy card the picks collect into. */
const STACK = { x: 1140, y: 270, w: 640, rowH: 62, top: 112 };

const PICKED = GROUPS.flatMap((g, gi) =>
  g.picks.map((oi, k) => ({ g: gi, i: oi, k, label: g.options[oi] })),
);

const abs = (x: number, y: number, extra?: CSSProperties): CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  ...extra,
});

export function Picks({ frame }: { frame: number }) {
  if (frame < B(28) - 2 || frame > B(53)) return null;
  const restraintExit = B(52);
  const stackCard = presence(
    frame,
    GRID_EXIT + 2,
    restraintExit,
    springs.morph,
  );
  return (
    <>
      <div style={abs(0, 120, { width: 1920, textAlign: "center" })}>
        <Kinetic
          frame={frame}
          words={[
            { text: "Pick", at: B(28) },
            { text: "the", at: H(28) },
            { text: "pieces.", at: B(29) },
            { text: "Skip", at: H(29), accentAt: B(41) },
            { text: "the", at: H(29) + 5, accentAt: B(41) + 3 },
            { text: "rest.", at: B(30), accentAt: B(41) + 6 },
          ]}
          exitAt={GRID_EXIT - 4}
          size={84}
        />
      </div>

      {GROUPS.map((group, g) => {
        const x = X0 + g * (COL_W + COL_GAP);
        const label = presence(frame, riseAt(g), GRID_EXIT);
        return (
          <div key={group.label}>
            {label.v > 0.001 ? (
              <div
                style={abs(x + 4, GRID_TOP - 46, {
                  fontFamily: font.mono,
                  fontSize: 19,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: color.muted,
                  ...swapStyle(label, { blur: 8, rise: 12 }),
                })}
              >
                {group.label}
              </div>
            ) : null}
            {group.options.map((option, i) => {
              const picked = group.picks.includes(i);
              if (picked) return null;
              const p = presence(
                frame,
                riseAt(g) + i * 4,
                GRID_EXIT + g * 2 + i,
                springs.swift,
                springs.morph,
              );
              if (p.v <= 0.001) return null;
              const passed = after(frame, pickAt(g, 0), springs.morph);
              const fall = p.exit * 70;
              return (
                <OptionCard
                  key={option}
                  label={option}
                  x={x}
                  y={GRID_TOP + i * (CARD_H + CARD_GAP)}
                  w={COL_W}
                  h={CARD_H}
                  style={{
                    opacity: p.v ** 1.3 * (1 - passed * 0.62),
                    transform: `translateY(${(1 - p.enter) * 30 + fall}px) scale(${1 - passed * 0.05})`,
                    filter:
                      p.v < 0.999 ? `blur(${(1 - p.v) * 10}px)` : undefined,
                  }}
                />
              );
            })}
          </div>
        );
      })}

      {stackCard.v > 0.001 ? (
        <>
          <div
            style={abs(STACK.x - 30, STACK.y, {
              width: STACK.w + 60,
              height: STACK.top + PICKED.length * STACK.rowH + 26,
              borderRadius: 32,
              background: color.paper,
              boxShadow: shadow,
              opacity: stackCard.v,
              transform: `scale(${0.96 + 0.04 * stackCard.enter})`,
            })}
          />
          <div
            style={abs(STACK.x, STACK.y + 36, {
              width: STACK.w,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: font.mono,
              fontSize: 21,
              color: color.muted,
              ...swapStyle(stackCard, { blur: 8, rise: 10 }),
            })}
          >
            <span>Your stack</span>
            <span>{PICKED.length} picks</span>
          </div>
        </>
      ) : null}

      {PICKED.map((pick, n) => {
        const gx = X0 + pick.g * (COL_W + COL_GAP);
        const gy = GRID_TOP + pick.i * (CARD_H + CARD_GAP);
        const sx = STACK.x;
        const sy = STACK.y + STACK.top + n * STACK.rowH;
        const p = presence(
          frame,
          riseAt(pick.g) + pick.i * 4,
          restraintExit + n * 1.5,
          springs.swift,
          springs.swift,
        );
        if (p.v <= 0.001) return null;
        const on = after(frame, pickAt(pick.g, pick.k));
        const fly = after(frame, GRID_EXIT + n * 4, springs.morph);
        return (
          <OptionCard
            key={pick.label}
            label={pick.label}
            x={mix(gx, sx, fly)}
            y={mix(gy, sy, fly)}
            w={mix(COL_W, STACK.w, fly)}
            h={mix(CARD_H, STACK.rowH - 10, fly)}
            on={on}
            style={{
              opacity: p.v ** 1.3,
              transform: `translateY(${(1 - p.enter) * 30}px) scale(${1 + on * 0.03 * (1 - fly)})`,
              filter: p.v < 0.999 ? `blur(${(1 - p.v) * 10}px)` : undefined,
            }}
          />
        );
      })}

      <div style={abs(140, 380, { width: 900 })}>
        {[
          { text: "No unnecessary files.", at: B(44) },
          { text: "No unnecessary dependencies.", at: B(46) },
          { text: "Just the stack you choose.", at: B(48), accent: true },
        ].map((line) => (
          <Kinetic
            key={line.text}
            frame={frame}
            words={line.text.split(" ").map((w, i) => ({
              text: w,
              at: line.at + i * 5,
              accentAt: line.accent && i > 0 ? line.at + i * 5 : undefined,
            }))}
            exitAt={restraintExit}
            size={64}
            style={{ marginBottom: 14 }}
          />
        ))}
      </div>
    </>
  );
}

function OptionCard({
  label,
  x,
  y,
  w,
  h,
  on = 0,
  style,
}: {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  on?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={abs(x, y, {
        width: w,
        height: h,
        boxSizing: "border-box",
        borderRadius: 18,
        padding: "0 14px 0 20px",
        gap: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: color.paper,
        border: `2px solid ${mixColor(color.hairline, color.accent, on)}`,
        boxShadow: shadow,
        fontFamily: font.sans,
        fontWeight: 500,
        fontSize: 22,
        letterSpacing: "-0.01em",
        color: color.ink,
        whiteSpace: "pre",
        ...style,
      })}
    >
      {label}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          flexShrink: 0,
          boxSizing: "border-box",
          border: `1.75px solid ${mixColor(color.rail, color.accent, on)}`,
          background: mixColor(color.paper, color.accent, on),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Check size={20} color={color.paper} draw={on} weight={2.5} />
      </div>
    </div>
  );
}

export const PICK_BEATS = GROUPS.flatMap((g, gi) =>
  g.picks.map((_, k) => pickAt(gi, k)),
);
export const RISE_BEATS = GROUPS.map((_, g) => riseAt(g));
