import AdditionsConstants from "./constants.js";
import AdditionsUtils from "./utils.js";

async function handleItemPilesInteraction(sourceDocument, itemData) {
  if (
    !AdditionsUtils.isResponsibleGM() ||
    !game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("itemPilesHandling")
    )
  ) {
    return;
  }

  const itemEntries = Array.isArray(itemData) ? itemData : [itemData];
  const source =
    sourceDocument.actor ?? sourceDocument._actor ?? sourceDocument;
  const itemsToDelete = [];

  itemEntries
    .map((itemInfo) => itemInfo?.item)
    .filter(
      (item, index) =>
        item &&
        itemEntries[index].quantity <= 1 &&
        item.type === "weapon" &&
        item.system?.installedItems?.list?.length
    )
    .forEach((item) => {
      itemsToDelete.push(...item.system.installedItems.list);
    });

  if (!itemsToDelete.length) return;

  window.setTimeout(async () => {
    const actualDelete = itemsToDelete.filter((id) => source.items.get(id));
    if (!actualDelete.length) return;
    await source.deleteEmbeddedDocuments("Item", actualDelete);
    if (
      source.items.size === 0 &&
      source.flags?.["item-piles"]?.data?.deleteWhenEmpty &&
      source.parent
    ) {
      await source.parent.delete();
    }
  }, 5000);
}

export default class ItemPilesAdditions {
  static initialize() {
    if (!game.modules.get("item-piles")?.active) return;

    Hooks.on("item-piles-removeItems", (target, itemDeltas) => {
      handleItemPilesInteraction(target, itemDeltas);
    });

    ["dropItem", "transferItems", "giveItem"].forEach((hookName) => {
      Hooks.on(`item-piles-${hookName}`, (source, _, itemData) => {
        handleItemPilesInteraction(source, itemData);
      });
    });
  }
}
