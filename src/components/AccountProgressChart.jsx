import { useMemo } from "react";

const CHART_WIDTH = 980;
const CHART_HEIGHT = 320;
const PADDING_X = 52;
const PADDING_Y = 24;

function toDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayKeyToLocalDate(dayKey) {
  if (typeof dayKey !== "string") return null;
  const parts = dayKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatShortDate(dayKey) {
  const date = dayKeyToLocalDate(dayKey);
  if (!date) return dayKey;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getPreviousDayKey(dayKey) {
  const date = dayKeyToLocalDate(dayKey);
  if (!date) return dayKey;
  date.setDate(date.getDate() - 1);
  return toDayKey(date);
}

function buildLinePath(points, toX, toY) {
  if (!points.length) return "";
  return points
    .map((point, index) => {
      const prefix = index === 0 ? "M" : "L";
      return `${prefix}${toX(point.x)},${toY(point.y)}`;
    })
    .join(" ");
}

function AccountProgressChart({
  tradeSummaries = [],
  completedTrades = [],
  initialFund = 0,
  cashflows = [],
  manualEndBalance = 0,
  hasManualEndBalance = false,
}) {
  const progress = useMemo(() => {
    const sourceTrades = tradeSummaries.length ? tradeSummaries : completedTrades;
    const pnlByDay = new Map();
    const flowsByDay = new Map();

    for (const trade of sourceTrades) {
      const dayKey = toDayKey(trade?.exitTime || trade?.entryTime);
      if (!dayKey) continue;
      pnlByDay.set(dayKey, (pnlByDay.get(dayKey) || 0) + Number(trade?.pnl || 0));
    }

    for (const item of cashflows) {
      const dayKey = toDayKey(item?.date);
      if (!dayKey) continue;
      const signedAmount = item.type === "withdrawal" ? -Math.abs(Number(item.amount || 0)) : Number(item.amount || 0);
      flowsByDay.set(dayKey, (flowsByDay.get(dayKey) || 0) + signedAmount);
    }

    const allDays = [...new Set([...pnlByDay.keys(), ...flowsByDay.keys()])].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    if (allDays.length === 0) {
      const todayKey = toDayKey(new Date().toISOString());
      allDays.push(todayKey);
    } else {
      // Include a baseline point before first activity so chart starts at true initial funding.
      allDays.unshift(getPreviousDayKey(allDays[0]));
    }

    let cumulativePnl = 0;
    let netDeposits = Number(initialFund || 0);

    const points = allDays.map((dayKey, index) => {
      netDeposits += Number(flowsByDay.get(dayKey) || 0);
      cumulativePnl += Number(pnlByDay.get(dayKey) || 0);
      const estimatedEquity = netDeposits + cumulativePnl;

      return {
        index,
        dayKey,
        netDeposits,
        pnl: cumulativePnl,
        estimatedEquity,
      };
    });

    const latestEstimatedEquity = points[points.length - 1]?.estimatedEquity || 0;
    const manualAdjustment = hasManualEndBalance ? Number(manualEndBalance || 0) - latestEstimatedEquity : 0;
    const adjustedPoints = points.map((point, index) => {
      const isLatest = index === points.length - 1;
      return {
        ...point,
        // Keep history unchanged; only align latest point with manual EOD balance when provided.
        equity: hasManualEndBalance && isLatest ? Number(manualEndBalance || 0) : point.estimatedEquity,
      };
    });

    return {
      points: adjustedPoints,
      latest: adjustedPoints[adjustedPoints.length - 1],
      latestEstimatedEquity,
      manualAdjustment,
    };
  }, [tradeSummaries, completedTrades, initialFund, cashflows, manualEndBalance, hasManualEndBalance]);

  const chart = useMemo(() => {
    const points = progress.points;
    const values = points.flatMap((point) => [point.equity, point.netDeposits]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const expandedMin = minValue - range * 0.12;
    const expandedMax = maxValue + range * 0.12;
    const yRange = expandedMax - expandedMin || 1;

    const drawableWidth = CHART_WIDTH - PADDING_X * 2;
    const drawableHeight = CHART_HEIGHT - PADDING_Y * 2;

    const toX = (index) => {
      if (points.length === 1) return PADDING_X + drawableWidth / 2;
      return PADDING_X + (index / (points.length - 1)) * drawableWidth;
    };
    const toY = (value) => PADDING_Y + ((expandedMax - value) / yRange) * drawableHeight;

    const equityLine = buildLinePath(
      points.map((point) => ({ x: point.index, y: point.equity })),
      toX,
      toY,
    );
    const depositsLine = buildLinePath(
      points.map((point) => ({ x: point.index, y: point.netDeposits })),
      toX,
      toY,
    );

    const yTicks = 5;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, idx) => expandedMin + (yRange * idx) / yTicks);
    const xLabelStep = Math.max(1, Math.floor(points.length / 7));

    return {
      points,
      toX,
      toY,
      equityLine,
      depositsLine,
      yTickValues,
      xLabelStep,
    };
  }, [progress]);

  return (
    <div className="ui-section">
      <h3>Account Progress (Basis: Net Deposits)</h3>

      <div className="ui-card-grid">
        <div className="ui-summary-card">
          <div className="ui-summary-label">Net Deposits</div>
          <strong className="ui-summary-value">{formatMoney(progress.latest?.netDeposits || 0)}</strong>
        </div>
        <div className="ui-summary-card">
          <div className="ui-summary-label">Realized P&L</div>
          <strong className="ui-summary-value">{formatMoney(progress.latest?.pnl || 0)}</strong>
        </div>
        <div className="ui-summary-card">
          <div className="ui-summary-label">{hasManualEndBalance ? "Manual-Aligned Equity" : "Estimated Equity"}</div>
          <strong className="ui-summary-value">{formatMoney(progress.latest?.equity || 0)}</strong>
        </div>
        {hasManualEndBalance && (
          <div className="ui-summary-card">
            <div className="ui-summary-label">Manual Balance Adjustment</div>
            <strong className="ui-summary-value">{formatMoney(progress.manualAdjustment || 0)}</strong>
          </div>
        )}
      </div>

      <div className="progress-chart-wrap">
        <svg className="progress-chart" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Account progress chart">
          {chart.yTickValues.map((tickValue) => (
            <g key={tickValue}>
              <line
                x1={PADDING_X}
                y1={chart.toY(tickValue)}
                x2={CHART_WIDTH - PADDING_X}
                y2={chart.toY(tickValue)}
                stroke="currentColor"
                opacity="0.14"
              />
              <text x={PADDING_X - 8} y={chart.toY(tickValue) + 4} textAnchor="end" className="progress-chart-axis-label">
                {Math.round(tickValue)}
              </text>
            </g>
          ))}

          <path d={chart.depositsLine} fill="none" stroke="#6b7280" strokeWidth="2" />
          <path d={chart.equityLine} fill="none" stroke="#0b7a2a" strokeWidth="2.5" />

          {chart.points.map((point) => (
            <circle key={point.dayKey} cx={chart.toX(point.index)} cy={chart.toY(point.equity)} r="2.5" fill="#0b7a2a" />
          ))}

          {chart.points.map((point, index) => {
            if (index % chart.xLabelStep !== 0 && index !== chart.points.length - 1) return null;
            return (
              <text key={`${point.dayKey}-label`} x={chart.toX(point.index)} y={CHART_HEIGHT - 8} textAnchor="middle" className="progress-chart-axis-label">
                {formatShortDate(point.dayKey)}
              </text>
            );
          })}
        </svg>

        <div className="progress-chart-legend">
          <span className="progress-legend-item">
            <span className="progress-legend-swatch progress-legend-swatch-equity" />
            {hasManualEndBalance ? "Equity (manual EOD aligned)" : "Equity"}
          </span>
          <span className="progress-legend-item">
            <span className="progress-legend-swatch progress-legend-swatch-deposits" />
            Net Deposits (basis)
          </span>
        </div>
      </div>
    </div>
  );
}

export default AccountProgressChart;
