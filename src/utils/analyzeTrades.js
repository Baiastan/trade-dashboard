export function analyzeByOptionType(trades) {
  const result = {
    call: {
      totalPnl: 0,
      wins: 0,
      losses: 0,
      trades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
    },
    put: {
      totalPnl: 0,
      wins: 0,
      losses: 0,
      trades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
    },
  };

  for (const trade of trades) {
    const type = trade.optionType; // "call" or "put"
    if (!result[type]) continue;

    result[type].trades += 1;
    result[type].totalPnl += trade.pnl;

    if (trade.pnl > 0) {
      result[type].wins += 1;
    } else if (trade.pnl < 0) {
      result[type].losses += 1;
    }
  }

  for (const type of ["call", "put"]) {
    const group = result[type];

    const wins = trades.filter((t) => t.optionType === type && t.pnl > 0);
    const losses = trades.filter((t) => t.optionType === type && t.pnl < 0);

    group.winRate = group.trades ? (group.wins / group.trades) * 100 : 0;

    group.avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;

    group.avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  }

  return result;
}
