import AdditionsConstants from "./constants.js";

const { renderTemplate } = foundry.applications.handlebars;

let materials = [];

const presets = [
  { name: "Choose...", material: "custom" },
  { name: "Bank Vault Door", material: "steel_thick" },
  { name: "Bank Window Glass", material: "bulletproofglass_thick" },
  { name: "Bar", material: "wood_thick" },
  { name: "Boulder", material: "stone_thick" },
  { name: "Bulletproof Windshield", material: "bulletproofglass_thin" },
  { name: "Car Door", material: "steel_thin" },
  { name: "Data Term", material: "concrete_thick" },
  { name: "Engine Block", material: "steel_thick" },
  { name: "Hydrant", material: "steel_thick" },
  { name: "Log Cabin Wall", material: "wood_thick" },
  { name: "Metal Door", material: "steel_thin" },
  { name: "Office Cubicle", material: "plaster-foam-plastic_thin" },
  { name: "Office Wall", material: "plaster-foam-plastic_thick" },
  { name: "Overturned Table", material: "wood_thin" },
  { name: "Prison Visitation Glass", material: "bulletproofglass_thin" },
  { name: "Refrigerator", material: "steel_thin" },
  { name: "Shipping Container", material: "steel_thin" },
  { name: "Sofa", material: "plaster-foam-plastic_thin" },
  { name: "Statue", material: "stone_thin" },
  { name: "Tree", material: "wood_thick" },
  { name: "Utility Pole", material: "concrete_thick" },
  { name: "Wardrobe", material: "wood_thin" },
  { name: "Windshield", material: "plaster-foam-plastic_thin" },
  { name: "Wooden Door", material: "wood_thin" },
];

function createMaterial(id, hp, thin) {
  return {
    value: `${id}_${thin ? "thin" : "thick"}`,
    name: game.i18n.format("diwako-cpred-additions.cover.materials.display", {
      material: game.i18n.localize(
        `diwako-cpred-additions.cover.materials.${id}`
      ),
      thickness: game.i18n.localize(
        `diwako-cpred-additions.cover.materials.${thin ? "thin" : "thick"}`
      ),
    }),
    hp,
  };
}

function initializeMaterials() {
  materials = [
    createMaterial("steel", 25, true),
    createMaterial("steel", 50, false),
    createMaterial("stone", 20, true),
    createMaterial("stone", 40, false),
    createMaterial("bulletproofglass", 15, true),
    createMaterial("bulletproofglass", 30, false),
    createMaterial("concrete", 10, true),
    createMaterial("concrete", 25, false),
    createMaterial("wood", 5, true),
    createMaterial("wood", 20, false),
    createMaterial("plaster-foam-plastic", 0, true),
    createMaterial("plaster-foam-plastic", 15, false),
    { value: "custom", name: game.i18n.localize("NOTE.Custom"), hp: -1 },
  ];
}

async function getPosition(height, width) {
  if (window.Portal) {
    const location = await new window.Portal()
      .texture(
        `systems/${game.system.id}/icons/compendium/armor/bullet_proof_shield.svg`
      )
      .size(Math.max(height, width) * 2)
      .pick();
    if (!location) return null;
    return location;
  }

  const { x, y } = canvas.mousePosition;
  return { x, y, elevation: 0 };
}

async function createActor() {
  const name = game.i18n.localize(
    "diwako-cpred-additions.cover.default-actor-name"
  );
  const actor = await Actor.create({
    name,
    type: "mook",
    img: `systems/${game.system.id}/icons/compendium/armor/bullet_proof_shield.svg`,
  });

  await actor.setFlag(
    "core",
    "sheetClass",
    `${game.system.id}.CPRMookActorSheet`
  );
  await actor.setFlag(game.system.id, "isCover", true);
  await actor.update({
    prototypeToken: {
      actorLink: false,
      displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
      displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
      disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      flags: {
        healthEstimate: {
          dontMarkDead: true,
          hideHealthEstimate: true,
          hideName: false,
        },
        splatter: { bloodColor: "#000000" },
      },
      img: `systems/${game.system.id}/icons/compendium/armor/bullet_proof_shield.svg`,
      name,
      vision: false,
    },
    system: {
      derivedStats: { hp: { max: 0, value: 0 } },
      stats: {
        body: { value: 0 },
        cool: { value: 0 },
        dex: { value: 0 },
        emp: { value: 0, max: 0 },
        int: { value: 0 },
        luck: { value: 0, max: 0 },
        move: { value: 0 },
        ref: { value: 0 },
        tech: { value: 0 },
        will: { value: 0 },
      },
    },
  });

  await game.settings.set(
    AdditionsConstants.SETTING_NAMESPACE,
    AdditionsConstants.settingKey("coverActorId"),
    actor.id
  );
  ui.notifications.notify(
    game.i18n.format("diwako-cpred-additions.cover.created-actor", {
      "actor-name": name,
    })
  );
  return actor;
}

async function getActor() {
  const actorId = game.settings.get(
    AdditionsConstants.SETTING_NAMESPACE,
    AdditionsConstants.settingKey("coverActorId")
  );
  return game.actors.get(actorId) ?? createActor();
}

async function createToken(name, height, width, position, hp) {
  const actor = await getActor();
  await actor.update({ "system.derivedStats.hp": { max: hp, value: hp } });
  const data = await actor.getTokenDocument({ x: 0, y: 0, name });
  const [token] = await canvas.scene.createEmbeddedDocuments("Token", [data]);

  await canvas.scene.updateEmbeddedDocuments(
    "Token",
    [
      {
        _id: token.id,
        "texture.scaleX": 1,
        "texture.scaleY": height / width,
        elevation: position.elevation ?? 0,
        height,
        hidden: game.settings.get(
          AdditionsConstants.SETTING_NAMESPACE,
          AdditionsConstants.settingKey("hideCoverTokenOnPlace")
        ),
        name,
        width,
        x: position.x - canvas.grid.size * (width / 2),
        y: position.y - canvas.grid.size * (height / 2),
      },
    ],
    { animate: false }
  );
}

async function extractData(html) {
  const root = html instanceof window.HTMLElement ? html : html[0];
  const height = Math.max(parseFloat(root.querySelector("#height").value), 0.5);
  const width = Math.max(parseFloat(root.querySelector("#width").value), 0.5);
  const hp = parseInt(root.querySelector("#hp").value, 10);
  if (hp <= 0) {
    ui.notifications.error(
      game.i18n.localize("diwako-cpred-additions.cover.zero-hp-no-cover")
    );
    return;
  }

  const preset = root.querySelector("#preset");
  const material = root.querySelector("#material");
  const name =
    preset.value !== "custom"
      ? preset.options[preset.selectedIndex].text
      : material.options[material.selectedIndex].text;
  const position = await getPosition(height, width);
  if (!position) return;
  await createToken(name, height, width, position, hp);
}

export default class AdditionsCover {
  static async createCover() {
    if (!game.user.isGM) {
      ui.notifications.error(
        game.i18n.localize("diwako-cpred-additions.cover.only-gm")
      );
      return;
    }
    if (materials.length === 0) initializeMaterials();

    const content = await renderTemplate(
      `systems/${game.system.id}/templates/additions/createcover.hbs`,
      {
        presets,
        materials,
      }
    );

    new Dialog({
      title: game.i18n.localize("diwako-cpred-additions.cover.dialog.title"),
      content,
      buttons: {
        confirm: {
          label: game.i18n.localize("CPR.dialog.common.confirm"),
          callback: (html) => extractData(html),
          icon: `<i class="fas fa-check"></i>`,
        },
        cancel: {
          label: game.i18n.localize("Cancel"),
          callback: () => {},
          icon: `<i class="fas fa-times"></i>`,
        },
      },
    }).render(true);
  }
}
