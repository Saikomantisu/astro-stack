import { Composition } from "remotion";
import { AstroStackTerminalWizard } from "./components/remocn/astro-stack-terminal-wizard";

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
