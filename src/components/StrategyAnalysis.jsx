import { useMemo } from "react";
import { getTradeSummaryStorageKey } from "../utils/getTradeSummaryStorageKey";

function StrategyAnalysis({ tradeSummaries = [], strategyMap = {} }) {
  const stats = useMemo(() => {
    const byStrategy = new Map();
    let assignedTrades = 0;

    for (const trade of tradeSummaries) {
      const key = getTradeSummaryStorageKey(trade);
      const strategy = String(strategyMap[key] || "").trim();
      if (!strategy) continue;

      assignedTrades += 1;
      const bucket = byStrategy.get(strategy) || {
        strategy,
        trades: 0,
        wins: 0,
        losses: 0,
        totalReturn: 0,
      };

      const returnPct = Number(trade?.returnPct || 0);
      bucket.trades += 1;
      bucket.totalReturn += returnPct;
      if (Number(trade?.pnl || 0) > 0) bucket.wins += 1;
      if (Number(trade?.pnl || 0) < 0) bucket.losses += 1;
      byStrategy.set(strategy, bucket);
    }

    const list = [...byStrategy.values()]
      .map((item) => ({
        ...item,
        winRate: item.trades ? (item.wins / item.trades) * 100 : 0,
        avgReturn: item.trades ? item.totalReturn / item.trades : 0,
        usagePct: assignedTrades ? (item.trades / assignedTrades) * 100 : 0,
      }))
      .sort((a, b) => b.trades - a.trades || b.winRate - a.winRate);

    return {
      assignedTrades,
      totalTrades: tradeSummaries.length,
      list,
    };
  }, [tradeSummaries, strategyMap]);

  return (
    <div className="strategy-panel">
      <h3>Strategy Analysis</h3>
      <div className="strategy-meta">
        Tagged trades: {stats.assignedTrades}/{stats.totalTrades}
      </div>

      {stats.list.length === 0 ? (
        <div className="strategy-empty">Add strategy tags in Trade Summary to see strategy analytics.</div>
      ) : (
        <div className="strategy-list">
          {stats.list.map((item) => (
            <div key={item.strategy} className="strategy-item">
              <div className="strategy-item-title">{item.strategy}</div>
              <div className="strategy-item-row">Used: {item.trades} ({item.usagePct.toFixed(1)}%)</div>
              <div className="strategy-item-row">Win Rate: {item.winRate.toFixed(1)}%</div>
              <div className="strategy-item-row">Avg Return: {item.avgReturn.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StrategyAnalysis;
