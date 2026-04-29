import AdditionsConstants from "./constants.js";
import AdditionsUtils from "./utils.js";

function addKeyFrame(time, on, addedDelay) {
  return {
    time: game.time.serverTime + time + addedDelay,
    angle: { enabled: false, value: 0 },
    bright: { enabled: true, value: on ? 25 : 0 },
    dim: { enabled: true, value: on ? 25 : 0 },
    rotation: { enabled: false, value: 0 },
    tintAlpha: { enabled: false, value: 0.5 },
    tintColor: { enabled: false, value: "#000000", isColor: true },
  };
}

async function onWorkflowStart(clonedData, animationData) {
  if (clonedData?.item?.system?.isRanged && !clonedData.ammoItem) {
    const foundAmmoItem = clonedData.item.system.installedItems?.list
      ?.map((installedId) => clonedData.token?.actor?.items?.get(installedId))
      ?.find((installedItem) => installedItem?.type === "ammo");
    if (foundAmmoItem) {
      foundry.utils.setProperty(clonedData, "ammoItem", foundAmmoItem);
      foundry.utils.setProperty(clonedData, "recheckAnimation", true);
      if (
        ["arrow", "paintball", "grenade"].includes(foundAmmoItem.system.variety)
      )
        return;
    }
  }

  if (
    !AdditionsUtils.isResponsibleGM() ||
    !game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("dfAmbientLightsEnable")
    ) ||
    !clonedData?.item?.system?.isRanged ||
    !clonedData?.ammoItem ||
    !clonedData?.token ||
    !animationData
  ) {
    return;
  }

  const addedDelay = 100;
  const targets = clonedData.targets || [];
  const target = targets[0]?.document;
  const { token } = clonedData;
  const delay = animationData?.primary?.options?.delay || 0;
  const secondaryDelay = animationData?.secondary?.options?.delay || 0;
  foundry.utils.setProperty(
    animationData,
    "primary.options.delay",
    delay + addedDelay
  );
  foundry.utils.setProperty(
    animationData,
    "primary.sound.delay",
    (animationData?.primary?.sound?.delay || 0) + addedDelay
  );
  foundry.utils.setProperty(
    animationData,
    "secondary.options.delay",
    secondaryDelay + addedDelay
  );
  foundry.utils.setProperty(
    animationData,
    "secondary.sound.delay",
    (animationData?.secondary?.sound?.delay || 0) + addedDelay
  );

  let { rotation } = token;
  if (target) {
    rotation =
      (360 -
        90 +
        Math.atan2(target.y - token.y, target.x - token.x) * (180 / Math.PI)) %
      360;
  }

  const repeat =
    clonedData?.overrideRepeat || animationData?.primary?.options?.repeat || 1;
  const repeatDelay = animationData?.primary?.options?.repeatDelay || 250;
  const keyFrames = [];
  const initFrame = addKeyFrame(0, false, addedDelay);
  initFrame.time = 0;
  keyFrames.push(initFrame, addKeyFrame(delay - 1, false, addedDelay));

  for (let index = 0; index < repeat; index += 1) {
    keyFrames.push(addKeyFrame(delay + repeatDelay * index, true, addedDelay));
    keyFrames.push(
      addKeyFrame(delay + repeatDelay * index + 49, true, addedDelay)
    );
    keyFrames.push(
      addKeyFrame(delay + repeatDelay * index + 50, false, addedDelay)
    );
    keyFrames.push(
      addKeyFrame(delay + repeatDelay * (index + 1) - 1, false, addedDelay)
    );
  }
  keyFrames.push(
    addKeyFrame(delay + repeatDelay * repeat + 10000, false, addedDelay)
  );

  const [light] = await canvas.scene.createEmbeddedDocuments("AmbientLight", [
    {
      x: token.x + canvas.grid.size / 2,
      y: token.y + canvas.grid.size / 2,
      rotation,
      config: {
        color: "#943400",
        dim: 20,
        bright: 20,
        luminosity: 0.5,
        angle: 270,
        attenuation: 1,
      },
      flags: {
        "df-active-lights": {
          anims: {
            bounce: false,
            offset: 0,
            keys: keyFrames,
          },
        },
      },
    },
  ]);

  window.setTimeout(() => {
    canvas.scene.deleteEmbeddedDocuments("AmbientLight", [light.id]);
  }, delay + repeatDelay * repeat + 2000 + addedDelay);
}

export default class DFAmbientLightsAdditions {
  static initialize() {
    if (
      game.modules.get("df-active-lights")?.active &&
      game.modules.get("autoanimations")?.active
    ) {
      Hooks.on("AutomatedAnimations-WorkflowStart", onWorkflowStart);
    }
  }
}
