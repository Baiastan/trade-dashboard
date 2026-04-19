import { useMemo } from "react";
import { analyzeByOptionType } from "../utils/analyzeTrades";

function OptionTypeAnalysis({ completedTrades = [], tradeSummaries = [] }) {
  const optionAnalysis = useMemo(() => {
    const sourceRecords = tradeSummaries.length ? tradeSummaries : completedTrades;
    return analyzeByOptionType(sourceRecords);
  }, [completedTrades, tradeSummaries]);

  return (
    <div className="analysis-section">
      <h3>Option Type Analysis</h3>

      <div className="analysis-grid">
        <AnalysisCard title="CALLS" data={optionAnalysis.call} />
        <AnalysisCard title="PUTS" data={optionAnalysis.put} />
      </div>
    </div>
  );
}

function AnalysisCard({ title, data }) {
  return (
    <div className="analysis-card">
      <h4 style={{ margin: "0 0 6px" }}>{title}</h4>
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
