import AdditionsConstants from "./constants.js";
import AdditionsSoundMenu from "./sound-menu.js";

const settingName = (key) => `diwako-cpred-additions.settings.${key}.name`;
const settingHint = (key) => `diwako-cpred-additions.settings.${key}.hint`;

function registerSetting(key, data) {
  game.settings.register(
    AdditionsConstants.SETTING_NAMESPACE,
    AdditionsConstants.settingKey(key),
    data
  );
}

export default function registerAdditionsSettings() {
  registerSetting("hitAnimations", {
    name: settingName("hit-animations"),
    hint: settingHint("hit-animations"),
    scope: "world",
    config: true,
    type: Boolean,
    default: window.Sequence != null,
  });

  registerSetting("jb2aPatreon", {
    name: settingName("jb2a-patreon"),
    hint: settingHint("jb2a-patreon"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("hitSounds", {
    name: settingName("hit-sounds"),
    hint: settingHint("hit-sounds"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.registerMenu(
    AdditionsConstants.SETTING_NAMESPACE,
    AdditionsConstants.settingKey("configureSoundsMenu"),
    {
      name: "diwako-cpred-additions.settings.sound-select.name",
      label: "diwako-cpred-additions.settings.sound-select.name",
      hint: "diwako-cpred-additions.settings.sound-select.hint",
      icon: "fas fa-cog",
      type: AdditionsSoundMenu,
      restricted: true,
    }
  );

  registerSetting("configuredSounds", {
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  registerSetting("showDVDisplay", {
    name: settingName("dv-display-show"),
    hint: settingHint("dv-display-show"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("dvDisplayOnlyInCombat", {
    name: settingName("dv-display-combat-only"),
    hint: settingHint("dv-display-combat-only"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("dvDisplayPosition", {
    name: settingName("dv-display-position"),
    hint: settingHint("dv-display-position"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      right: "diwako-cpred-additions.settings.dv-display-position.right",
      left: "diwako-cpred-additions.settings.dv-display-position.left",
    },
    default: "right",
  });

  registerSetting("showWeaponNamesInDvDisplay", {
    name: settingName("dv-display-show-weapon-name"),
    hint: settingHint("dv-display-show-weapon-name"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("hideCoverTokenOnPlace", {
    name: settingName("cover-token-hide-on-place"),
    hint: settingHint("cover-token-hide-on-place"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("coverActorId", {
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  registerSetting("poorWeaponCheck", {
    name: settingName("poor-weapon-check"),
    hint: settingHint("poor-weapon-check"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("dfAmbientLightsEnable", {
    name: settingName("dfAmbientLights-enable"),
    hint: settingHint("dfAmbientLights-enable"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  registerSetting("itemPilesHandling", {
    name: settingName("itemPilesHandling"),
    hint: settingHint("itemPilesHandling"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
}
