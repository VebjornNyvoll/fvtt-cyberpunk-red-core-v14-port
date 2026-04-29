import AdditionsConstants from "./constants.js";
import AdditionsUtils from "./utils.js";

function parseAttackCard(message) {
  const div = document.createElement("div");
  div.innerHTML = message.content;

  const damageAction = div.querySelector("[data-action=rollDamage]");
  if (!damageAction) return null;

  const attackType = div
    .querySelector("div.rollcard-subtitle-center.text-small")
    ?.innerHTML.trim();
  if (attackType === game.i18n.localize("CPR.rolls.suppressiveFire"))
    return null;

  const rollTotal = parseInt(
    div.querySelector("span.clickable[data-action='toggleVisibility']")
      ?.innerHTML,
    10
  );
  if (Number.isNaN(rollTotal)) return null;

  return {
    data: damageAction.dataset,
    attackType,
    rollTotal,
    isInitialOne: div
      .querySelector(".d10")
      ?.getAttribute("src")
      ?.includes("d10_1_fail.svg"),
  };
}

function findAttackContext(message, data) {
  const token = AdditionsUtils.getTokenFromRollData(message, data);
  const actor = token?.actor ?? game.actors.get(data.actorId);
  const item = actor?.items?.get(data.itemId);
  return { token, actor, item };
}

function playMissAnimation(token, message) {
  if (
    !window.Sequence ||
    !game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("hitAnimations")
    )
  ) {
    return;
  }

  const filePath = game.settings.get(
    AdditionsConstants.SETTING_NAMESPACE,
    AdditionsConstants.settingKey("jb2aPatreon")
  )
    ? "modules/jb2a_patreon/Library/Generic/UI/Miss_01_Red_200x200.webm"
    : "modules/JB2A_DnD5e/Library/Generic/UI/Miss_02_White_200x200.webm";

  new window.Sequence()
    .effect()
    .delay(1000)
    .file(filePath)
    .snapToGrid()
    .atLocation(token, { gridUnits: true, offset: { x: 0, y: -0.55 } })
    .scaleToObject(1.35)
    .locally(message.whisper?.length !== 0)
    .play();
}

function playHitEffects(token, target, message) {
  if (!window.Sequence) return;
  const sequence = new window.Sequence();

  if (
    game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("hitSounds")
    )
  ) {
    const sounds = game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("configuredSounds")
    );
    if (sounds.length > 0) {
      const soundFile = sounds[Math.floor(Math.random() * sounds.length)];
      sequence
        .sound()
        .delay(1000)
        .file(soundFile)
        .volume(0.35)
        .locally(message.whisper?.length !== 0);
    }
  }

  if (
    game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("hitAnimations")
    )
  ) {
    const filePath = game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("jb2aPatreon")
    )
      ? "modules/jb2a_patreon/Library/Generic/Weapon_Attacks/Melee/DmgBludgeoning_01_Regular_Yellow_2Handed_800x600.webm"
      : "modules/JB2A_DnD5e/Library/Generic/Impact/Impact_07_Regular_Orange_400x400.webm";
    const angle =
      (360 +
        Math.atan2(target.y - token.y, target.x - token.x) * (180 / Math.PI)) %
      360;
    sequence
      .effect()
      .delay(250)
      .file(filePath)
      .atLocation(target, {
        offset: {
          x: -Math.cos((angle * Math.PI) / 180),
          y: -Math.sin((angle * Math.PI) / 180),
        },
        gridUnits: true,
      })
      .rotate(angle * -1)
      .locally(message.whisper?.length !== 0);
  }

  sequence.play();
}

async function createResultMessage(message, content, backgroundColor) {
  await ChatMessage.create(
    {
      speaker: message.speaker,
      content: `<div class="cpr-block" style="padding:10px;background-color:${backgroundColor}">${content}</div>`,
      whisper: message.whisper,
    },
    { chatBubble: false }
  );
}

async function handleDoesItHit(message) {
  if (AdditionsUtils.getMessageAuthorId(message) !== game.user.id) return;
  const parsed = parseAttackCard(message);
  if (!parsed) return;

  const target = game.user.targets.first();
  if (!target) return;

  const { token, actor, item } = findAttackContext(message, parsed.data);
  if (!token || !actor || !item) return;

  let dvTable = item.system?.dvTable;
  if (!dvTable) return;
  if (
    parsed.attackType ===
    game.i18n.localize("CPR.global.itemType.skill.autofire")
  ) {
    dvTable = `${dvTable} (Autofire)`;
  }

  const dv = await AdditionsUtils.getDV(
    dvTable,
    AdditionsUtils.getDistance(token, target)
  );
  if (dv < 0) return;

  const targetActor = target.actor ?? target.document?.actor;
  const messageReplaceMap = {
    attacker: token.name,
    target: target.document.name,
    dv,
    "dv-diff": parsed.rollTotal - dv,
    "dv-diff+1": dv - parsed.rollTotal + 1,
    "dv-diff-1": parsed.rollTotal - 1 - dv,
  };

  let stringKey = "diwako-cpred-additions.message.hit.normal";
  let backgroundColor = "var(--cpr-text-chat-success, #2d9f36)";
  if (dv >= parsed.rollTotal) {
    backgroundColor = "var(--cpr-text-chat-failure, #b90202ff)";
    stringKey = "diwako-cpred-additions.message.missed.normal";
    if ((targetActor?.system?.stats?.ref?.value ?? 0) >= 8) {
      stringKey = "diwako-cpred-additions.message.missed.evade";
    }
    playMissAnimation(token, message);
  } else if ((targetActor?.system?.stats?.ref?.value ?? 0) >= 8) {
    stringKey = "diwako-cpred-additions.message.hit.evade";
    playHitEffects(token, target, message);
  } else {
    playHitEffects(token, target, message);
  }

  await createResultMessage(
    message,
    game.i18n.format(stringKey, messageReplaceMap),
    backgroundColor
  );
}

async function handlePoorWeaponCheck(message) {
  if (
    AdditionsUtils.getMessageAuthorId(message) !== game.user.id ||
    !game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("poorWeaponCheck")
    )
  ) {
    return;
  }

  const parsed = parseAttackCard(message);
  if (!parsed?.isInitialOne) return;
  const { token, actor, item } = findAttackContext(message, parsed.data);
  if (!token || !actor || !item) return;

  const itemName = item.name.toLowerCase();
  const localizedPoor = game.i18n
    .localize("diwako-cpred-additions.poor-weapon-check.word-indicator")
    .toLowerCase();
  const isPoorWeapon =
    item.system.quality === "poor" ||
    itemName.includes("(poor)") ||
    itemName.includes(localizedPoor);
  if (!isPoorWeapon) return;

  const keyMap = {
    destroyed: "diwako-cpred-additions.poor-weapon-check.break-weapon",
    destroyedBeyondRepair:
      "diwako-cpred-additions.poor-weapon-check.break-beyond-weapon",
    jammed: "diwako-cpred-additions.poor-weapon-check.jam-weapon",
    coinToss: "diwako-cpred-additions.poor-weapon-check.cointoss",
  };
  const stringKey = keyMap[item.system.critFailEffect];
  if (!stringKey) return;

  await ChatMessage.create(
    {
      speaker: message.speaker,
      content: `<div class="cpr-block" style="padding:10px;display:block">${game.i18n.format(
        stringKey,
        { attacker: token.name, weapon: item.name }
      )}</div>`,
      whisper: message.whisper,
    },
    { chatBubble: false }
  );
}

export default function registerChatAdditions() {
  Hooks.on("createChatMessage", async (message) => {
    await handleDoesItHit(message);
    await handlePoorWeaponCheck(message);
  });
}
