export default class AdditionsTemplate {
  static async createTemplate(args) {
    const [, , inputData] = args;
    if (!window.Portal) {
      ui.notifications.error(
        game.i18n.localize("diwako-cpred-additions.template.portal-missing")
      );
      return;
    }

    const position = await new window.Portal()
      .texture("icons/svg/explosion.svg")
      .size(inputData.size * 2)
      .pick();
    if (!position) return;

    const templateSize = inputData.size * 2;
    const { distance } = canvas.dimensions;
    const trueWidth = templateSize / distance;
    const gridSize = canvas.grid.size;
    const templateInfo = {
      angle: 0,
      direction: 45,
      distance: Math.sqrt(templateSize * templateSize * 2),
      fillColor: game.user.color,
      x: position.x - (trueWidth / 2) * gridSize,
      y: position.y - (trueWidth / 2) * gridSize,
      borderColor: "#000000",
      t: "rect",
    };

    await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [
      templateInfo,
    ]);
  }
}
