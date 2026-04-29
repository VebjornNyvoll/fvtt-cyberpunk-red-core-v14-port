import AdditionsCover from "./cover.js";
import AdditionsTemplate from "./template.js";
import DFAmbientLightsAdditions from "./df-ambient-lights.js";
import DvDisplay from "./dv-display.js";
import ItemPilesAdditions from "./item-piles.js";
import registerAdditionsSettings from "./settings.js";
import registerChatAdditions from "./chat-hit-check.js";

export default function registerAdditions() {
  Hooks.once("init", () => {
    registerAdditionsSettings();
    DvDisplay.initialize();
    DFAmbientLightsAdditions.initialize();
    ItemPilesAdditions.initialize();
    registerChatAdditions();

    const api = {
      funcs: {
        createCover: AdditionsCover.createCover,
        createTemplate: AdditionsTemplate.createTemplate,
      },
    };

    game.cpr.additions = api;
    game.cpr.api.additions = api.funcs;
    window.cpr_additions = api;
  });
}
