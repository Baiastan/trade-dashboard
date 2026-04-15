import { useEffect, useMemo, useState } from "react";

function AccountSummary({ completedTrades, onAccountDataChange }) {
  const [initialFundInput, setInitialFundInput] = useState(() => {
    return localStorage.getItem("initialFund") || "";
  });

  const [cashflows, setCashflows] = useState(() => {
    const saved = localStorage.getItem("cashflows");
    return saved ? JSON.parse(saved) : [];
  });

  const [amountInput, setAmountInput] = useState("");
  const [type, setType] = useState("deposit");
  const [date, setDate] = useState("");

  const initialFund = Number(initialFundInput || 0);

  useEffect(() => {
    localStorage.setItem("initialFund", initialFundInput);
  }, [initialFundInput]);

  useEffect(() => {
    localStorage.setItem("cashflows", JSON.stringify(cashflows));
  }, [cashflows]);

  useEffect(() => {
    onAccountDataChange?.({
      initialFund,
      cashflows,
    });
  }, [initialFund, cashflows, onAccountDataChange]);

  const addCashflow = () => {
    const numericAmount = Number(amountInput || 0);
    if (!numericAmount || !date) return;

    const newCashflow = {
      id: Date.now().toString(),
      type,
      amount: numericAmount,
      date,
    };

    setCashflows((prev) => [newCashflow, ...prev]);
    setAmountInput("");
    setDate("");
    setType("deposit");
  };

  const removeCashflow = (id) => {
    setCashflows((prev) => prev.filter((item) => item.id !== id));
  };

  const realizedPnl = useMemo(() => {
    return completedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  }, [completedTrades]);

  const totalDeposits = useMemo(() => {
    return cashflows.filter((item) => item.type === "deposit").reduce((sum, item) => sum + item.amount, 0);
  }, [cashflows]);

  const totalWithdrawals = useMemo(() => {
    return cashflows.filter((item) => item.type === "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  }, [cashflows]);

  const netDeposits = initialFund + totalDeposits - totalWithdrawals;
  const estimatedEquity = netDeposits + realizedPnl;

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <h3>Account Summary</h3>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
          alignItems: "end",
        }}
      >
        <div>
          <label>Initial Fund</label>
          <br />
          <input
            type="number"
            step="0.01"
            value={initialFundInput}
            onChange={(e) => setInitialFundInput(e.target.value)}
            placeholder="e.g. 2650"
          />
        </div>

        <div>
          <label>Type</label>
          <br />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
        </div>

        <div>
          <label>Amount</label>
          <br />
          <input
            type="number"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="e.g. 1000"
          />
        </div>

        <div>
          <label>Date</label>
          <br />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <button onClick={addCashflow}>Add</button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <SummaryCard label="Initial Fund" value={initialFund} />
        <SummaryCard label="Deposits" value={totalDeposits} />
        <SummaryCard label="Withdrawals" value={totalWithdrawals} />
        <SummaryCard label="Net Deposits" value={netDeposits} />
        <SummaryCard label="Realized P&L" value={realizedPnl} />
        <SummaryCard label="Estimated Equity" value={estimatedEquity} />
      </div>

      {cashflows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>TYPE</th>
                <th>AMOUNT</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {cashflows.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.type.toUpperCase()}</td>
                  <td>${item.amount.toFixed(2)}</td>
                  <td>{item.date}</td>
                  <td>
                    <button onClick={() => removeCashflow(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
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
          color: numericValue > 0 ? "green" : numericValue < 0 ? "red" : "black",
        }}
      >
        ${numericValue.toFixed(2)}
      </strong>
    </div>
  );
}

export default AccountSummary;
