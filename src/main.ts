import "./styles/tokens.css";
import "./styles/anim.css";
import "./styles/app.css";

import { mountGame } from "./ui/game";
import { fromLocation } from "./ui/seed";

document.title = "EZ Baccarat";

mountGame({
  seed: fromLocation(),
});
