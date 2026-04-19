function TradeStats({ completedTrades = [], tradeSummaries = [] }) {
  const tradeLevelRecords = tradeSummaries.length ? tradeSummaries : completedTrades;
  const totalPnl = tradeLevelRecords.reduce((sum, trade) => sum + trade.pnl, 0);
  const wins = tradeLevelRecords.filter((trade) => trade.pnl > 0);
  const losses = tradeLevelRecords.filter((trade) => trade.pnl < 0);
  const winRate = tradeLevelRecords.length ? ((wins.length / tradeLevelRecords.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="analysis-grid">
      <div className="analysis-card">
        <div>Total P&L</div>
        <strong
          style={{
            color: totalPnl > 0 ? "green" : totalPnl < 0 ? "red" : "black",
          }}
        >
          ${totalPnl.toFixed(2)}
        </strong>
      </div>

      <div className="analysis-card">
        <div>Win Rate</div>
        <strong>{winRate}%</strong>
      </div>

      <div className="analysis-card">
        <div>Wins</div>
        <strong>{wins.length}</strong>
      </div>

      <div className="analysis-card">
        <div>Losses</div>
        <strong>{losses.length}</strong>
      </div>
    </div>
  );
}

export default TradeStats;
