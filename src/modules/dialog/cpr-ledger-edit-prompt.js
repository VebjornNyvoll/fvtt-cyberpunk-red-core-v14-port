import SystemUtils from "../utils/cpr-systemUtils.js";

const { renderTemplate } = foundry.applications.handlebars;

export default class LedgerEditPrompt {
  static async RenderPrompt(title) {
    const content = await renderTemplate(
      `systems/${game.system.id}/templates/dialog/cpr-ledger-edit-prompt.hbs`
    );
    const DialogV2 = foundry.applications?.api?.DialogV2;
    if (DialogV2) {
      const result = await DialogV2.wait({
        window: { title: SystemUtils.Localize(title) },
        content,
        rejectClose: true,
        buttons: [
          {
            action: "confirm",
            icon: "fa-solid fa-check",
            label: SystemUtils.Localize("CPR.dialog.common.confirm"),
            default: true,
            callback: (_event, button) => {
              const fd = new FormDataExtended(button.form);
              return foundry.utils.expandObject(fd.object);
            },
          },
          {
            action: "cancel",
            icon: "fa-solid fa-xmark",
            label: SystemUtils.Localize("CPR.dialog.common.cancel"),
            callback: () => null,
          },
        ],
      });
      if (result === null) throw new Error("Promise rejected: Window Closed");
      return result;
    }

    return new Promise((resolve, reject) => {
      Promise.resolve(content).then((html) => {
        const _onCancel = () => {
          reject(new Error("Promise rejected: Window Closed"));
        };
        // eslint-disable-next-line no-shadow
        const _onConfirm = (html) => {
          const fd = new FormDataExtended(html.find("form")[0]);
          const formData = foundry.utils.expandObject(fd.object);
          resolve(formData);
        };
        new Dialog({
          title: SystemUtils.Localize(title),
          content: html,
          buttons: {
            confirm: {
              icon: '<i class="fas fa-check"></i>',
              label: SystemUtils.Localize("CPR.dialog.common.confirm"),
              // eslint-disable-next-line no-shadow
              callback: (html) => _onConfirm(html),
            },
            cancel: {
              icon: '<i class="fas fa-xmark"></i>',
              label: SystemUtils.Localize("CPR.dialog.common.cancel"),
              callback: () => _onCancel(html),
            },
          },
          default: "confirm",
          close: () => {
            reject(new Error("Promise rejected: Window Closed"));
          },
        }).render(true);
      });
    });
  }
}
