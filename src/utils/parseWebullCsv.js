import { parseOptionSymbol } from "./parseOptionSymbol";

export function cleanPrice(value) {
  return Number(
    String(value || "")
      .replace("@", "")
      .trim() || 0,
  );
}

export function parseWebullRows(rows) {
  return rows
    .filter((row) => row.Status === "Filled")
    .map((row) => {
      const optionData = parseOptionSymbol(row.Symbol);
      const avgPrice = cleanPrice(row["Avg Price"]);
      const rawPrice = cleanPrice(row.Price);
      const price = avgPrice || rawPrice;

      return {
        symbol: row.Symbol,
        side: String(row.Side || "").toLowerCase(),
        qty: Number(row.Filled || 0),
        price,
        filledTime: row["Filled Time"] || row["Placed Time"],
        status: row.Status,
        underlying: optionData?.underlying,
        optionType: optionData?.type,
        expiration: optionData?.expiration,
        strike: optionData?.strike,
      };
    })
    .filter((row) => row.qty > 0 && row.price > 0);
}
