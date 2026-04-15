function getExpirationDate(symbol) {
  const match = symbol.match(/^[A-Z]+(\d{6})[CP]\d{8}$/);
  if (!match) return null;

  const raw = match[1]; // YYMMDD
  const year = 2000 + Number(raw.slice(0, 2));
  const month = Number(raw.slice(2, 4)) - 1;
  const day = Number(raw.slice(4, 6));

  return new Date(year, month, day, 23, 59, 59, 999);
}

export function buildCompletedTrades(fills) {
  const sorted = [...fills].sort((a, b) => new Date(a.filledTime).getTime() - new Date(b.filledTime).getTime());

  const openBySymbol = new Map();
  const completed = [];

  for (const fill of sorted) {
    const symbol = fill.symbol;
    const openPositions = openBySymbol.get(symbol) || [];

    if (fill.side === "buy") {
      openPositions.push({ ...fill });
      openBySymbol.set(symbol, openPositions);
      continue;
    }

    if (fill.side === "sell") {
      let remainingQty = fill.qty;

      while (remainingQty > 0 && openPositions.length > 0) {
        const earliestOpen = openPositions[0];
        const matchedQty = Math.min(earliestOpen.qty, remainingQty);

        const pnl = (fill.price - earliestOpen.price) * matchedQty * 100;

        completed.push({
          symbol,
          underlying: earliestOpen.underlying,
          optionType: earliestOpen.optionType,
          strike: earliestOpen.strike,
          expiration: earliestOpen.expiration,
          qty: matchedQty,
          entryPrice: earliestOpen.price,
          exitPrice: fill.price,
          entryTime: earliestOpen.filledTime,
          exitTime: fill.filledTime,
          pnl: Number(pnl.toFixed(2)),
        });

        earliestOpen.qty -= matchedQty;
        remainingQty -= matchedQty;

        if (earliestOpen.qty === 0) {
          openPositions.shift();
        }
      }

      openBySymbol.set(symbol, openPositions);
    }
  }

  const now = new Date();

  for (const [symbol, openPositions] of openBySymbol.entries()) {
    const expirationDate = getExpirationDate(symbol);

    if (!expirationDate) continue;
    if (expirationDate > now) continue;

    for (const open of openPositions) {
      if (open.qty <= 0) continue;

      const pnl = (0 - open.price) * open.qty * 100;

      completed.push({
        symbol,
        underlying: open.underlying,
        optionType: open.optionType,
        strike: open.strike,
        expiration: open.expiration,
        qty: open.qty,
        entryPrice: open.price,
        exitPrice: 0,
        entryTime: open.filledTime,
        exitTime: expirationDate.toISOString(),
        pnl: Number(pnl.toFixed(2)),
      });
    }

    openBySymbol.set(symbol, []);
  }

  return completed;
}
