import { useMemo } from "react";
import { analyzeByOptionType } from "../utils/analyzeTrades";

function OptionTypeAnalysis({ completedTrades }) {
  const optionAnalysis = useMemo(() => {
    return analyzeByOptionType(completedTrades);
  }, [completedTrades]);

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <h3>Option Type Analysis</h3>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <AnalysisCard title="CALLS" data={optionAnalysis.call} />
        <AnalysisCard title="PUTS" data={optionAnalysis.put} />
      </div>
    </div>
  );
}

function AnalysisCard({ title, data }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 10,
        padding: 16,
        minWidth: 220,
      }}
    >
      <h4>{title}</h4>
      <div>Trades: {data.trades}</div>
      <div>Win Rate: {data.winRate.toFixed(1)}%</div>
      <div style={{ color: data.totalPnl > 0 ? "green" : data.totalPnl < 0 ? "red" : "black" }}>
        Total P&L: ${data.totalPnl.toFixed(2)}
      </div>
      <div>Avg Win: ${data.avgWin.toFixed(2)}</div>
      <div>Avg Loss: ${data.avgLoss.toFixed(2)}</div>
    </div>
  );
}

export default OptionTypeAnalysis;
