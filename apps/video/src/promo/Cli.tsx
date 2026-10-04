import { color, font } from "../shared/theme";
import { Kinetic } from "./Kinetic";
import { presence, swapStyle } from "./motion";
import { TERM, TerminalCli, WINDOW } from "./TerminalCli";
import { B, H } from "./timeline";

/** The terminal sits in the right half, centred on this point. */
const CX = 1395;
const CY = 540;

export function Cli({ frame }: { frame: number }) {
  const sub = presence(frame, B(16), TERM.exit);
  if (frame < B(14) - 2 || frame > TERM.exit + 40) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 130, top: 380, width: 720 }}>
        <Kinetic
          frame={frame}
          words={[
            { text: "Answer", at: B(14) },
            { text: "a", at: H(14) },
            { text: "few", at: H(14) + 4 },
          ]}
          exitAt={TERM.exit}
          size={92}
        />
        <Kinetic
          frame={frame}
          words={[{ text: "questions.", at: B(15) }]}
          exitAt={TERM.exit}
          size={92}
        />
        {sub.v > 0.001 ? (
          <div
            style={{
              marginTop: 34,
              width: 600,
              fontFamily: font.sans,
              fontSize: 32,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              color: color.muted,
              ...swapStyle(sub, { blur: 10, rise: 18 }),
            }}
          >
            A guided flight plan — no starter repo to clean up.
          </div>
        ) : null}
      </div>
      <TerminalCli frame={frame} style={{ left: CX - WINDOW.w / 2, top: CY }} />
    </>
  );
}
