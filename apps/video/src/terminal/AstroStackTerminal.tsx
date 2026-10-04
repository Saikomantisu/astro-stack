import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SFX, type SoundName } from "../shared/sfx";
import { commandKeys, devKeys, LAUNCH, nameKeys, PROMPTS, T } from "./session";
import { Terminal } from "./Terminal";
import { FPS } from "./timeline";

interface Sound {
  sound: SoundName;
  frame: number;
  volume: number;
}

const keySound = (i: number): SoundName =>
  (["key-0", "key-1", "key-2", "key-3"] as const)[i % 4];

const typing = (keys: readonly { frame: number }[], seed: number): Sound[] =>
  keys.map((k, i) => ({
    sound: keySound(i + seed),
    frame: k.frame,
    volume: 0.3,
  }));

const SOUNDS: Sound[] = [
  ...typing(commandKeys, 0),
  ...typing(nameKeys, 1),
  ...typing(devKeys, 2),
  ...[
    T.commandEnter,
    T.nameEnter,
    ...PROMPTS.map((p) => p.enter),
    LAUNCH.enter,
    T.devEnter,
  ].map((frame) => ({ sound: "enter" as const, frame, volume: 0.45 })),
  ...PROMPTS.flatMap((p) =>
    p.keys.map((k) => ({
      sound: k.key === "space" ? ("space" as const) : ("move" as const),
      frame: k.at,
      volume: k.key === "space" ? 0.45 : 0.28,
    })),
  ),
  // Flight plan rows and dependency lines print with a quiet tick.
  ...Array.from({ length: 12 }, (_, i) => ({
    sound: "print" as const,
    frame: T.flightPlan + 17 + 3 + i * 3,
    volume: 0.12,
  })),
  ...[2, 5, 6, 7, 8, 9, 10, 11].map((line) => ({
    sound: "print" as const,
    frame: T.deps + line * 2,
    volume: 0.14,
  })),
  { sound: "ready", frame: T.ready, volume: 0.42 },
  { sound: "key-1", frame: T.interrupt, volume: 0.3 },
  { sound: "key-3", frame: T.clear, volume: 0.3 },
];

export function AstroStackTerminal() {
  return (
    <AbsoluteFill>
      <Terminal />
      <Audio src={staticFile("audio/terminal-music.wav")} volume={0.6} />
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
