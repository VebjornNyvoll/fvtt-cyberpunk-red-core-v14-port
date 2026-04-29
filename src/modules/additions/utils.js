const DV_CACHE = new Map();

function normalizeToken(token) {
  if (!token) return null;
  if (token.document) return token;
  return canvas.tokens?.get(token.id) ?? token.object ?? token;
}

function tokenCenter(token) {
  const tokenObject = normalizeToken(token);
  if (tokenObject?.center) return tokenObject.center;

  const document = tokenObject?.document ?? tokenObject;
  const { size } = canvas.grid;
  return {
    x: document.x + ((document.width ?? 1) * size) / 2,
    y: document.y + ((document.height ?? 1) * size) / 2,
  };
}

export default class AdditionsUtils {
  static getDistance(sourceToken, targetToken) {
    const source = normalizeToken(sourceToken);
    const target = normalizeToken(targetToken);
    if (!source || !target) return 0;

    const path = canvas.grid.measurePath([
      tokenCenter(source),
      tokenCenter(target),
    ]);
    const groundDistance = path.cost ?? path.distance ?? 0;
    const sourceElevation = source.document?.elevation ?? source.elevation ?? 0;
    const targetElevation = target.document?.elevation ?? target.elevation ?? 0;
    const elevationDelta = sourceElevation - targetElevation;
    return Math.round(Math.sqrt(groundDistance ** 2 + elevationDelta ** 2));
  }

  static async getDV(dvTable, distance) {
    let cachedData = DV_CACHE.get(dvTable);
    if (!cachedData) {
      let table = game.tables.getName(dvTable);
      if (!table) {
        const compendium = game.settings.get(
          game.system.id,
          "dvRollTableCompendium"
        );
        const pack =
          game.packs.get(compendium) ??
          game.packs.get(`${game.system.id}.internal_dv-tables`);

        await pack?.getIndex();
        const tableId = pack?.index.getName(dvTable)?._id;
        if (!tableId) {
          return -1;
        }
        table = await pack.getDocument(tableId);
      }
      cachedData = { table, dvs: new Map() };
      DV_CACHE.set(dvTable, cachedData);
    }

    let dv = cachedData.dvs.get(distance);
    if (!dv) {
      const draw = await cachedData.table.getResultsForRoll(distance);
      if (!draw?.length) {
        return -1;
      }
      dv = parseInt(draw[0].text, 10);
      cachedData.dvs.set(distance, dv);
    }
    return dv;
  }

  static isResponsibleGM() {
    if (!game.user.isGM) return false;
    const activeGMs = game.users.filter((user) => user.active && user.isGM);
    return activeGMs.length > 0 && activeGMs[0].id === game.user.id;
  }

  static getMessageAuthorId(message) {
    return message.user?.id ?? message.user ?? message._source?.author;
  }

  static getTokenFromRollData(message, data) {
    return (
      canvas.tokens?.get(message.speaker?.token) ??
      canvas.scene?.tokens.get(data?.tokenId)?.object ??
      canvas.tokens?.placeables.find(
        (token) => token.name === message.speaker?.alias
      ) ??
      null
    );
  }
}
