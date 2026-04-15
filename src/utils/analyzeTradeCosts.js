export function analyzeTradeCosts(tradeSummaries = []) {
  const winningTrades = tradeSummaries.filter((t) => t.pnl > 0);
  const losingTrades = tradeSummaries.filter((t) => t.pnl < 0);

  const avgWinningCost = winningTrades.length
    ? winningTrades.reduce((sum, t) => sum + t.cost, 0) / winningTrades.length
    : 0;

  const avgLosingCost = losingTrades.length
    ? losingTrades.reduce((sum, t) => sum + t.cost, 0) / losingTrades.length
    : 0;

  return {
    avgWinningCost,
    avgLosingCost,
    winningCount: winningTrades.length,
    losingCount: losingTrades.length,
  };
}
