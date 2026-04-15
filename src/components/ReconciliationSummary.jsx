import { useEffect, useMemo, useState } from "react";

function ReconciliationSummary({ initialFund, cashflows, completedTrades }) {
  const [brokerBalanceInput, setBrokerBalanceInput] = useState(() => {
    return localStorage.getItem("brokerBalance") || "";
  });

  const brokerBalance = Number(brokerBalanceInput || 0);

  useEffect(() => {
    localStorage.setItem("brokerBalance", brokerBalanceInput);
  }, [brokerBalanceInput]);

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
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <h3>Reconciliation</h3>

      <div style={{ marginBottom: 16 }}>
        <label>Manual End of Day Balance</label>
        <br />
        <input
          type="number"
          step="0.01"
          value={brokerBalanceInput}
          onChange={(e) => setBrokerBalanceInput(e.target.value)}
          placeholder="e.g. 1653.40"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <SummaryCard label="Net Funding" value={netFunding} />
        <SummaryCard label="Realized P&L" value={realizedPnl} />
        <SummaryCard label="Estimated Equity" value={estimatedEquity} />
        <SummaryCard label="End of Day Balance" value={brokerBalance} />
        <SummaryCard
          label="Mismatch"
          value={difference}
          customColor={Math.abs(difference) < 0.01 ? "black" : difference > 0 ? "orange" : "red"}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, customColor }) {
  const numericValue = Number(value || 0);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        minWidth: 150,
      }}
    >
      <div>{label}</div>
      <strong
        style={{
          color: customColor || (numericValue > 0 ? "green" : numericValue < 0 ? "red" : "black"),
        }}
      >
        ${numericValue.toFixed(2)}
      </strong>
    </div>
  );
}

export default ReconciliationSummary;
