export function getTradeSummaryStorageKey(trade) {
  return [
    trade?.symbol ?? "",
    trade?.entryTime ?? "",
    trade?.exitTime ?? "",
    trade?.qty ?? "",
    trade?.avgEntry ?? "",
    trade?.avgExit ?? "",
    trade?.pnl ?? "",
  ].join("|");
}
