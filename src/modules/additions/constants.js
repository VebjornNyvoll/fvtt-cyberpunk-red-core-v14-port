export default class AdditionsConstants {
  static MODULE_ID = "diwako-cpred-additions";

  static SETTING_NAMESPACE = "cyberpunk-red-core";

  static PREFIX = "cprAdditions";

  static settingKey(key) {
    return `${this.PREFIX}.${key}`;
  }
}
