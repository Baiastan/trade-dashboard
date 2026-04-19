function TradeBehaviorStats({ tradeSummaries = [] }) {
  const winningTrades = tradeSummaries.filter((trade) => trade.returnPct > 0);
  const losingTrades = tradeSummaries.filter((trade) => trade.returnPct < 0);

  const avgProfitTakePct = winningTrades.length
    ? winningTrades.reduce((sum, trade) => sum + trade.returnPct, 0) / winningTrades.length
    : 0;

  const avgLossStopPct = losingTrades.length
    ? losingTrades.reduce((sum, trade) => sum + trade.returnPct, 0) / losingTrades.length
    : 0;

  return (
    <div className="analysis-section">
      <h3>Trade Behavior</h3>

      <div className="analysis-grid">
        <StatCard
          label="Average Profit Take %"
          value={`${avgProfitTakePct.toFixed(2)}%`}
          color={avgProfitTakePct > 0 ? "green" : "black"}
        />

        <StatCard
          label="Average Loss Stop %"
          value={`${avgLossStopPct.toFixed(2)}%`}
          color={avgLossStopPct < 0 ? "red" : "black"}
        />

        <StatCard label="Winning Trades Count" value={String(winningTrades.length)} color="black" />

        <StatCard label="Losing Trades Count" value={String(losingTrades.length)} color="black" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="analysis-card">
      <div>{label}</div>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

export default TradeBehaviorStats;
