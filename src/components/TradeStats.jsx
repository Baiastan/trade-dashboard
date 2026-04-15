function TradeStats({ completedTrades }) {
  const totalPnl = completedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const wins = completedTrades.filter((trade) => trade.pnl > 0);
  const losses = completedTrades.filter((trade) => trade.pnl < 0);
  const winRate = completedTrades.length ? ((wins.length / completedTrades.length) * 100).toFixed(1) : "0.0";

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        marginTop: 20,
        marginBottom: 20,
      }}
    >
      <div style={cardStyle}>
        <div>Total P&L</div>
        <strong
          style={{
            color: totalPnl > 0 ? "green" : totalPnl < 0 ? "red" : "black",
          }}
        >
          ${totalPnl.toFixed(2)}
        </strong>
      </div>

      <div style={cardStyle}>
        <div>Win Rate</div>
        <strong>{winRate}%</strong>
      </div>

      <div style={cardStyle}>
        <div>Wins</div>
        <strong>{wins.length}</strong>
      </div>

      <div style={cardStyle}>
        <div>Losses</div>
        <strong>{losses.length}</strong>
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 16,
  minWidth: 140,
};

export default TradeStats;
