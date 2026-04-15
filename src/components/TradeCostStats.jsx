import { useMemo } from "react";
import { analyzeTradeCosts } from "../utils/analyzeTradeCosts";

function TradeCostStats({ tradeSummaries = [] }) {
  const stats = useMemo(() => {
    return analyzeTradeCosts(tradeSummaries);
  }, [tradeSummaries]);

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <h3>Trade Cost Analysis</h3>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card label="Avg Cost (Winning Trades)" value={`$${stats.avgWinningCost.toFixed(2)}`} color="green" />

        <Card label="Avg Cost (Losing Trades)" value={`$${stats.avgLosingCost.toFixed(2)}`} color="red" />

        <Card label="Winning Trades" value={stats.winningCount} color="black" />

        <Card label="Losing Trades" value={stats.losingCount} color="black" />
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        minWidth: 200,
      }}
    >
      <div>{label}</div>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

export default TradeCostStats;
