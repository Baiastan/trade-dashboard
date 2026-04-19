import { useMemo } from "react";
import { analyzeTradeCosts } from "../utils/analyzeTradeCosts";

function TradeCostStats({ tradeSummaries = [] }) {
  const stats = useMemo(() => {
    return analyzeTradeCosts(tradeSummaries);
  }, [tradeSummaries]);

  return (
    <div className="analysis-section">
      <h3>Trade Cost Analysis</h3>

      <div className="analysis-grid">
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
    <div className="analysis-card">
      <div>{label}</div>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

export default TradeCostStats;
