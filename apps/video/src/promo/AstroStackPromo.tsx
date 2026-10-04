import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SFX, type SoundName } from "../shared/sfx";
import { color } from "../shared/theme";
import { Cli } from "./Cli";
import { PICK_BEATS, Picks, RISE_BEATS } from "./Picks";
import { EndCard, Hook, PromiseScene } from "./Scenes";
import { cliKeys, TERM, TERMINAL_ENTERS, TERMINAL_MOVES } from "./TerminalCli";
import { B, FPS } from "./timeline";

interface Sound {
  sound: SoundName;
  frame: number;
  volume: number;
}

const SOUNDS: Sound[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    sound: "soft-tick" as const,
    frame: B(0) + i * 11,
    volume: 0.18,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    sound: "print" as const,
    frame: B(4) + i * 2,
    volume: 0.12,
  })),
  ...cliKeys.map((k, i) => ({
    sound: (["key-0", "key-1", "key-2", "key-3"] as const)[i % 4],
    frame: k.frame,
    volume: 0.26,
  })),
  ...TERMINAL_ENTERS.map((frame) => ({
    sound: "enter" as const,
    frame,
    volume: 0.42,
  })),
  ...TERMINAL_MOVES.map((frame) => ({
    sound: "move" as const,
    frame,
    volume: 0.26,
  })),
  { sound: "tick", frame: TERM.ready, volume: 0.34 },
  ...RISE_BEATS.map((frame) => ({
    sound: "soft-tick" as const,
    frame,
    volume: 0.16,
  })),
  ...PICK_BEATS.map((frame) => ({
    sound: "tick" as const,
    frame,
    volume: 0.32,
  })),
  ...[B(44), B(46), B(48)].map((frame) => ({
    sound: "soft-tick" as const,
    frame,
    volume: 0.2,
  })),
  { sound: "ready", frame: B(52), volume: 0.36 },
];

export function AstroStackPromo() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: color.canvas }}>
      <Hook frame={frame} />
      <PromiseScene frame={frame} />
      <Cli frame={frame} />
      <Picks frame={frame} />
      <EndCard frame={frame} />
      <Audio src={staticFile("audio/promo-music.wav")} volume={0.7} />
      {SOUNDS.map((e) => (
        <Sequence
          key={`${e.sound}@${e.frame}`}
          from={Math.round(e.frame - SFX[e.sound].peakSeconds * FPS)}
          durationInFrames={e.sound === "ready" ? 60 : 24}
          layout="none"
        >
          <Audio src={staticFile(SFX[e.sound].file)} volume={() => e.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
