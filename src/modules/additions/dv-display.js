import CPR from "../system/config.js";
import AdditionsConstants from "./constants.js";
import AdditionsUtils from "./utils.js";

const SHOWN_WEAPONS = [];

function isDisplayableRangedWeapon(item) {
  return (
    item?.system?.isRanged &&
    (item.system.equipped === "equipped" ||
      (item.type === "cyberware" && item.system.isInstalled)) &&
    item.system.dvTable
  );
}

function shouldShowAutofire(item) {
  return Boolean(
    item?.system?.fireModes?.autoFire ||
      item?.system?.fireModes?.suppressiveFire
  );
}

function generateDisplayText(item, showWeaponNames, dv, autofire = false) {
  let { name } = item;
  let duplicateCheckValue = item.name;
  if (!showWeaponNames) {
    name = game.i18n.localize(CPR.weaponTypes[item.system.weaponType]);
    duplicateCheckValue = item.system.weaponType;
  }

  if (autofire) {
    name += " (Autofire)";
    duplicateCheckValue += " (Autofire)";
  }

  if (SHOWN_WEAPONS.includes(duplicateCheckValue)) return "";
  SHOWN_WEAPONS.push(duplicateCheckValue);

  return game.i18n.format("diwako-cpred-additions.dv-display.dv-text", {
    "weapon-name": name,
    "dv-value": dv,
  });
}

async function appendWeaponText(item, distance, showWeaponNames) {
  let displayText = "";
  let count = 0;

  const dv = await AdditionsUtils.getDV(item.system.dvTable, distance);
  if (dv > 0) {
    const newText = generateDisplayText(item, showWeaponNames, dv);
    if (newText) {
      displayText += newText;
      count += 1;
    }
  }

  if (shouldShowAutofire(item)) {
    const autofireDv = await AdditionsUtils.getDV(
      `${item.system.dvTable} (Autofire)`,
      distance
    );
    if (autofireDv > 0) {
      const newText = generateDisplayText(
        item,
        showWeaponNames,
        autofireDv,
        true
      );
      if (newText) {
        displayText += newText;
        count += 1;
      }
    }
  }

  return { displayText, count };
}

export default class DvDisplay {
  static initialize() {
    Hooks.on("drawToken", (token) => {
      DvDisplay.ensureContainer(token);
    });

    Hooks.on("hoverToken", (token, hovered) => {
      if (hovered) DvDisplay.show(token);
      else DvDisplay.clear(token);
    });

    Hooks.on("controlToken", (token) => {
      DvDisplay.clear(token);
    });
  }

  static async show(hoveredToken) {
    if (
      !game.settings.get(
        AdditionsConstants.SETTING_NAMESPACE,
        AdditionsConstants.settingKey("showDVDisplay")
      ) ||
      (game.settings.get(
        AdditionsConstants.SETTING_NAMESPACE,
        AdditionsConstants.settingKey("dvDisplayOnlyInCombat")
      ) &&
        !game.combat?.started)
    ) {
      return;
    }

    const sourceToken = canvas.tokens.controlled[0];
    if (!sourceToken || sourceToken === hoveredToken || !sourceToken.actor)
      return;

    DvDisplay.ensureContainer(hoveredToken);

    const distance = AdditionsUtils.getDistance(sourceToken, hoveredToken);
    const showWeaponNames = game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("showWeaponNamesInDvDisplay")
    );

    let displayText = "";
    let count = 0;
    SHOWN_WEAPONS.splice(0, SHOWN_WEAPONS.length);

    const displayableItems = sourceToken.actor.items
      .filter((item) => isDisplayableRangedWeapon(item))
      .flatMap((item) => [
        item,
        ...(item.getInstalledItems?.() ?? []).filter((installedItem) =>
          isDisplayableRangedWeapon(installedItem)
        ),
      ]);

    const results = await Promise.all(
      displayableItems.map((item) =>
        appendWeaponText(item, distance, showWeaponNames)
      )
    );
    results.forEach((result) => {
      displayText += result.displayText;
      count += result.count;
    });

    if (count === 0) return;

    const position = game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("dvDisplayPosition")
    );
    DvDisplay.clear(hoveredToken);

    const style = CONFIG.canvasTextStyle.clone();
    style.align = position === "right" ? "left" : "right";
    const text = new window.PreciseText(displayText, style);
    text.anchor.set(1, 0);

    hoveredToken.dvDisplay.addChild(text);
    if (position === "right") {
      hoveredToken.dvDisplay.position.set(
        hoveredToken.w + hoveredToken.dvDisplay.width + 15,
        0
      );
    } else {
      hoveredToken.dvDisplay.position.set(-15, 0);
    }
  }

  static clear(token) {
    token?.dvDisplay?.removeChildren()?.forEach((display) => display.destroy());
  }

  static ensureContainer(token) {
    if (!token.dvDisplay) {
      foundry.utils.setProperty(
        token,
        "dvDisplay",
        token.addChild(new window.PIXI.Container())
      );
    }
  }
}
