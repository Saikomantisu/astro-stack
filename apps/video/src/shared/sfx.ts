import sfx from "./sfx.json";

/** UI sounds from scripts/make-sfx.py, each with its measured peak. */
export const SFX = sfx;
export type SoundName = keyof typeof sfx;
