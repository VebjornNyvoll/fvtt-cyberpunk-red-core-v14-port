import AdditionsConstants from "./constants.js";

export default class AdditionsSoundMenu extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "cpr-additions-sounds-menu",
      title: game.i18n.localize(
        "diwako-cpred-additions.settings.sound-select.name"
      ),
      template: `systems/${game.system.id}/templates/additions/soundmenu.hbs`,
      classes: ["sheet", "dialog-sheet", "cpr-additions-sounds-menu"],
      width: 500,
      height: 500,
      closeOnSubmit: true,
      submitOnClose: false,
      resizable: true,
    });
  }

  async getData() {
    const data = await super.getData();
    const userSounds = game.settings.get(
      AdditionsConstants.SETTING_NAMESPACE,
      AdditionsConstants.settingKey("configuredSounds")
    );
    return { ...data, userSounds };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("th a .fa-trash").click((event) => {
      event.target.closest("tr")?.remove();
    });

    html.find(".add-row").click((event) => {
      const target = event.currentTarget;
      new window.FilePicker({
        type: "audio",
        current: target.getAttribute("src"),
        callback: (path) => AdditionsSoundMenu.newRow(target, path),
        top: this.position.top + 40,
        left: this.position.left + 10,
      }).browse(target.getAttribute("src"));
    });

    html.find("#save-hit-sounds").click(async () => {
      const paths = Array.from(html[0].querySelectorAll(".diw-audiopath")).map(
        (element) => element.value
      );
      await game.settings.set(
        AdditionsConstants.SETTING_NAMESPACE,
        AdditionsConstants.settingKey("configuredSounds"),
        paths
      );
      this.close();
    });
  }

  static newRow(target, path) {
    const newRow = $(
      `<tr>
        <th><input type="text" class="diw-audiopath" value="${path}" readonly/></th>
        <th><a><i class="fa-solid fa-trash"></i></a></th>
      </tr>`
    );
    newRow.insertBefore(target);
    newRow.find("a .fa-trash").click((event) => {
      event.target.closest("tr")?.remove();
    });
  }
}
