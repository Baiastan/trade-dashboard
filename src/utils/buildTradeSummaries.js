function getExpirationDate(symbol) {
  const match = symbol.match(/^[A-Z]+(\d{6})[CP]\d{8}$/);
  if (!match) return null;

  const raw = match[1];
  const year = 2000 + Number(raw.slice(0, 2));
  const month = Number(raw.slice(2, 4)) - 1;
  const day = Number(raw.slice(4, 6));

  return new Date(year, month, day, 23, 59, 59, 999);
}

export function buildTradeSummaries(fills = []) {
  const sorted = [...fills].sort((a, b) => new Date(a.filledTime).getTime() - new Date(b.filledTime).getTime());

  const openTradesBySymbol = new Map();
  const completedSummaries = [];
  const now = new Date();

  for (const fill of sorted) {
    const symbol = fill.symbol;
    let currentTrade = openTradesBySymbol.get(symbol);

    if (!currentTrade) {
      currentTrade = {
        symbol,
        underlying: fill.underlying,
        optionType: fill.optionType,
        strike: fill.strike,
        entryTime: fill.filledTime,
        exitTime: null,

        totalBuyQty: 0,
        totalBuyValue: 0,

        totalSellQty: 0,
        totalSellValue: 0,
      };
    }

    if (fill.side === "buy") {
      currentTrade.totalBuyQty += fill.qty;
      currentTrade.totalBuyValue += fill.qty * fill.price * 100;
    }

    if (fill.side === "sell") {
      currentTrade.totalSellQty += fill.qty;
      currentTrade.totalSellValue += fill.qty * fill.price * 100;
      currentTrade.exitTime = fill.filledTime;
    }

    const remainingQty = currentTrade.totalBuyQty - currentTrade.totalSellQty;

    if (remainingQty === 0 && currentTrade.totalBuyQty > 0) {
      const totalCost = currentTrade.totalBuyValue;
      const totalProceeds = currentTrade.totalSellValue;
      const pnl = totalProceeds - totalCost;

      const avgEntry = currentTrade.totalBuyQty ? currentTrade.totalBuyValue / currentTrade.totalBuyQty / 100 : 0;

      const avgExit = currentTrade.totalSellQty ? currentTrade.totalSellValue / currentTrade.totalSellQty / 100 : 0;

      const returnPct = totalCost ? (pnl / totalCost) * 100 : 0;

      completedSummaries.push({
        symbol: currentTrade.symbol,
        underlying: currentTrade.underlying,
        optionType: currentTrade.optionType,
        strike: currentTrade.strike,
        qty: currentTrade.totalBuyQty,
        avgEntry: Number(avgEntry.toFixed(4)),
        avgExit: Number(avgExit.toFixed(4)),
        cost: Number(totalCost.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2)),
        entryTime: currentTrade.entryTime,
        exitTime: currentTrade.exitTime,
      });

      openTradesBySymbol.delete(symbol);
    } else {
      openTradesBySymbol.set(symbol, currentTrade);
    }
  }

  for (const [symbol, trade] of openTradesBySymbol.entries()) {
    const expirationDate = getExpirationDate(symbol);
    if (!expirationDate || expirationDate > now) continue;

    const remainingQty = trade.totalBuyQty - trade.totalSellQty;
    if (remainingQty <= 0) continue;

    trade.totalSellQty += remainingQty;
    trade.totalSellValue += 0;
    trade.exitTime = expirationDate.toISOString();

    const totalCost = trade.totalBuyValue;
    const totalProceeds = trade.totalSellValue;
    const pnl = totalProceeds - totalCost;

    const avgEntry = trade.totalBuyQty ? trade.totalBuyValue / trade.totalBuyQty / 100 : 0;

    const avgExit = trade.totalSellQty ? trade.totalSellValue / trade.totalSellQty / 100 : 0;

    const returnPct = totalCost ? (pnl / totalCost) * 100 : 0;

    completedSummaries.push({
      symbol: trade.symbol,
      underlying: trade.underlying,
      optionType: trade.optionType,
      strike: trade.strike,
      qty: trade.totalBuyQty,
      avgEntry: Number(avgEntry.toFixed(4)),
      avgExit: Number(avgExit.toFixed(4)),
      cost: Number(totalCost.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      returnPct: Number(returnPct.toFixed(2)),
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
    });
  }

  return completedSummaries.sort((a, b) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime());
}
