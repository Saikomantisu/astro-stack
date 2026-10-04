import "./index.css";
import {
  AstroStackCliDemo,
  AstroStackPromo,
  AstroStackTerminal,
} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <AstroStackCliDemo />
      <AstroStackTerminal />
      <AstroStackPromo />
    </>
  );
};
