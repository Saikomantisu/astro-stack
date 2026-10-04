import type { CSSProperties } from "react";
import { springs } from "../lib/remocn-ui";
import { color, font, shadow } from "../shared/theme";
import { Kinetic, wordsFrom } from "./Kinetic";
import { after, presence, swapStyle } from "./motion";
import { B, H, WIDTH } from "./timeline";

const centered: CSSProperties = {
  position: "absolute",
  left: 0,
  width: WIDTH,
  textAlign: "center",
};

/** Starter-repo leftovers that pile up around the hook, then get struck. */
const CRUFT = [
  { text: "src/pages/blog-demo/", x: 170, y: 150 },
  { text: "eslint.config.js", x: 760, y: 112 },
  { text: ".prettierrc", x: 1330, y: 168 },
  { text: "sample-posts/", x: 1560, y: 300 },
  { text: "components/Hero2.astro", x: 120, y: 800 },
  { text: "example.test.ts", x: 690, y: 880 },
  { text: "public/placeholder.png", x: 1180, y: 820 },
  { text: "moment", x: 300, y: 330 },
];

export function Hook({ frame }: { frame: number }) {
  const exit = B(6);
  return (
    <>
      {CRUFT.map((chip, i) => {
        const at = B(0) + i * 11;
        const p = presence(
          frame,
          at,
          B(5) + i * 2,
          springs.swift,
          springs.morph,
        );
        if (p.v <= 0.001) return null;
        const strike = after(frame, B(4) + i * 2, springs.morph);
        const sweep = p.exit;
        const style = swapStyle(p, { blur: 10, rise: 24 });
        return (
          <div
            key={chip.text}
            style={{
              position: "absolute",
              left: chip.x,
              top: chip.y,
              ...style,
              transform: `translate(${-sweep * 220}px, ${(1 - p.enter) * 24}px)`,
            }}
          >
            <div
              style={{
                position: "relative",
                height: 64,
                padding: "0 26px",
                display: "flex",
                alignItems: "center",
                borderRadius: 32,
                background: color.paper,
                border: `1.5px solid ${color.hairline}`,
                boxShadow: shadow,
                fontFamily: font.mono,
                fontSize: 25,
                color: color.muted,
                whiteSpace: "pre",
              }}
            >
              {chip.text}
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  right: 20,
                  top: 31,
                  height: 2.5,
                  borderRadius: 2,
                  background: color.ink,
                  transform: `scaleX(${strike})`,
                  transformOrigin: "left center",
                }}
              />
            </div>
          </div>
        );
      })}
      <div style={{ ...centered, top: 410 }}>
        <Kinetic
          frame={frame}
          words={[
            { text: "Every", at: B(0) },
            { text: "Astro", at: H(0) },
            { text: "starter", at: B(1) },
            { text: "ships", at: H(1) },
          ]}
          exitAt={exit}
          size={104}
        />
        <Kinetic
          frame={frame}
          words={[
            { text: "things", at: B(2) },
            { text: "you'll", at: H(2) },
            { text: "delete.", at: B(3), accentAt: B(4) },
          ]}
          exitAt={exit}
          size={104}
          ink={color.ink}
        />
      </div>
    </>
  );
}

export function PromiseScene({ frame }: { frame: number }) {
  const exit = B(13) - 4;
  return (
    <div style={{ ...centered, top: 400 }}>
      <Kinetic
        frame={frame}
        words={wordsFrom("Astro Stack ships", H(6), 15)}
        exitAt={exit}
        size={104}
      />
      <Kinetic
        frame={frame}
        words={[
          { text: "only", at: B(9), accentAt: B(9) },
          { text: "what", at: B(10), accentAt: B(10) },
          { text: "you", at: H(10), accentAt: H(10) },
          { text: "pick.", at: B(11), accentAt: B(11) },
        ]}
        exitAt={exit}
        size={104}
      />
    </div>
  );
}

/** Caret that blinks on the beat. */
const blink = (frame: number) => (((frame % 30) + 30) % 30 < 15 ? 1 : 0);

export function EndCard({ frame }: { frame: number }) {
  const pill = presence(frame, B(54));
  const url = presence(frame, B(55));
  const tagline = presence(frame, B(53));
  return (
    <>
      <div style={{ ...centered, top: 300 }}>
        <Kinetic
          frame={frame}
          words={[
            { text: "Astro", at: B(52) },
            { text: "Stack", at: H(52) },
          ]}
          size={150}
          weight={600}
          tracking={-0.05}
        />
      </div>
      {tagline.v > 0.001 ? (
        <div
          style={{
            ...centered,
            top: 500,
            fontFamily: font.sans,
            fontSize: 40,
            letterSpacing: "-0.02em",
            color: color.muted,
            ...swapStyle(tagline, { blur: 10, rise: 18 }),
          }}
        >
          Your Astro project, ready for liftoff.
        </div>
      ) : null}
      {pill.v > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: WIDTH / 2 - 330,
            top: 620,
            width: 660,
            height: 96,
            borderRadius: 48,
            background: color.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font.mono,
            fontSize: 34,
            color: color.paper,
            whiteSpace: "pre",
            boxShadow: shadow,
            ...swapStyle(pill, { blur: 12, rise: 24 }),
            transform: `translateY(${(1 - pill.enter) * 24}px) scale(${0.94 + 0.06 * pill.enter})`,
          }}
        >
          <span style={{ color: "#77746F" }}>$ </span>
          pnpm create astro-stack
          <span
            style={{
              width: 3,
              height: 38,
              marginLeft: 6,
              borderRadius: 2,
              background: color.paper,
              opacity: blink(frame),
            }}
          />
        </div>
      ) : null}
      {url.v > 0.001 ? (
        <div
          style={{
            ...centered,
            top: 770,
            fontFamily: font.mono,
            fontSize: 28,
            color: color.muted,
            ...swapStyle(url, { blur: 8, rise: 14 }),
          }}
        >
          astrostack.ravinath.dev
        </div>
      ) : null}
    </>
  );
}
