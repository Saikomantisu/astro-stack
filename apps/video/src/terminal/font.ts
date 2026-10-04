import { loadFont } from "@remotion/google-fonts/GeistMono";

/** One monospace face; 700 stands in for ANSI bold. */
export const mono = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
}).fontFamily;
