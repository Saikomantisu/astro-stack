import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

const geist = loadGeist("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const font = {
  sans: geist.fontFamily,
  mono: geistMono.fontFamily,
};

export const color = {
  canvas: "#EAE7E2",
  ink: "#0B0B0C",
  paper: "#FFFFFF",
  muted: "#77736D",
  faint: "#A9A49D",
  hairline: "#E7E4DF",
  wash: "#F3F1ED",
  rail: "#DCD8D2",
  accent: "#A443EC",
  accentInk: "#FFFFFF",
} as const;

export const shadow =
  "0 1px 2px rgba(20, 16, 10, 0.06), 0 10px 30px rgba(20, 16, 10, 0.07)";
