import { useEffect, useMemo, useRef, useState } from "react";
import { FormField, SummaryMetricCard, TextInput } from "./ui/FormControls";

function formatBrokerInput(value) {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(numeric);
}

function ReconciliationSummary({
  initialFund,
  cashflows,
  completedTrades,
  brokerBalanceValue = "",
  onBrokerBalanceChange,
}) {
  const [brokerBalanceInput, setBrokerBalanceInput] = useState(formatBrokerInput(brokerBalanceValue));
  const focusedRef = useRef(false);

  const brokerBalance = Number(brokerBalanceInput || 0);

  useEffect(() => {
    if (focusedRef.current) return;
    const incoming = formatBrokerInput(brokerBalanceValue);
    setBrokerBalanceInput((prev) => {
      const prevIsEmpty = prev === "";
      const incomingIsEmpty = incoming === "";
      if (prevIsEmpty && incomingIsEmpty) return prev;
      const prevNumeric = Number(prev || 0);
      const incomingNumeric = Number(incoming || 0);
      if (!prevIsEmpty && !incomingIsEmpty && prevNumeric === incomingNumeric) return prev;
      return incoming;
    });
  }, [brokerBalanceValue]);

  useEffect(() => {
    onBrokerBalanceChange?.(brokerBalanceInput);
  }, [brokerBalanceInput, onBrokerBalanceChange]);

  const realizedPnl = useMemo(() => {
    return completedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  }, [completedTrades]);

  const totalDeposits = useMemo(() => {
    return cashflows.filter((item) => item.type === "deposit").reduce((sum, item) => sum + item.amount, 0);
  }, [cashflows]);

  const totalWithdrawals = useMemo(() => {
    return cashflows.filter((item) => item.type === "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  }, [cashflows]);

  const netFunding = Number(initialFund || 0) + totalDeposits - totalWithdrawals;
  const estimatedEquity = netFunding + realizedPnl;
  const difference = brokerBalance - estimatedEquity;

  return (
    <div className="ui-section">
      <h3>Reconciliation</h3>

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <FormField label="Manual End of Day Balance">
          <TextInput
            type="number"
            step="0.01"
            value={brokerBalanceInput}
            onChange={(e) => setBrokerBalanceInput(e.target.value)}
            onFocus={() => {
              focusedRef.current = true;
            }}
            onBlur={() => {
              focusedRef.current = false;
            }}
            placeholder="e.g. 1653.40"
          />
        </FormField>
      </div>

      <div className="ui-card-grid">
        <SummaryMetricCard label="Net Funding" value={netFunding} />
        <SummaryMetricCard label="Realized P&L" value={realizedPnl} />
        <SummaryMetricCard label="Estimated Equity" value={estimatedEquity} />
        <SummaryMetricCard label="End of Day Balance" value={brokerBalance} />
        <SummaryMetricCard
          label="Mismatch"
          value={difference}
          customColor={Math.abs(difference) < 0.01 ? "black" : difference > 0 ? "orange" : "red"}
        />
      </div>
    </div>
  );
}

export default ReconciliationSummary;
