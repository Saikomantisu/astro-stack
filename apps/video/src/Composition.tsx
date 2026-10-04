import { Composition } from "remotion";
import { AstroStackTerminalWizard } from "./components/remocn/astro-stack-terminal-wizard";
import { AstroStackPromo as PromoVideo } from "./promo/AstroStackPromo";
import * as promo from "./promo/timeline";
import { AstroStackTerminal as TerminalVideo } from "./terminal/AstroStackTerminal";
import { SIZE } from "./terminal/grid";
import * as terminal from "./terminal/timeline";

export const AstroStackCliDemo = () => (
  <Composition
    id="AstroStackCliDemo"
    component={AstroStackTerminalWizard}
    durationInFrames={1380}
    fps={30}
    width={1280}
    height={720}
  />
);

export const AstroStackTerminal = () => (
  <Composition
    id="AstroStackTerminal"
    component={TerminalVideo}
    durationInFrames={terminal.DURATION}
    fps={terminal.FPS}
    width={SIZE}
    height={SIZE}
  />
);

export const AstroStackPromo = () => (
  <Composition
    id="AstroStackPromo"
    component={PromoVideo}
    durationInFrames={promo.DURATION}
    fps={promo.FPS}
    width={promo.WIDTH}
    height={promo.HEIGHT}
  />
);
