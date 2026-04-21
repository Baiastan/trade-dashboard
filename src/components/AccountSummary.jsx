import { useEffect, useMemo, useRef, useState } from "react";
import { ActionButton, FormField, FormRow, SelectInput, SummaryMetricCard, TextInput } from "./ui/FormControls";

function formatNumberForInput(value) {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(numeric);
}

function AccountSummary({ completedTrades, onAccountDataChange, initialFundValue = 0, cashflowsValue = [] }) {
  const [initialFundInput, setInitialFundInput] = useState(formatNumberForInput(initialFundValue));
  const [cashflows, setCashflows] = useState(Array.isArray(cashflowsValue) ? cashflowsValue : []);

  const [amountInput, setAmountInput] = useState("");
  const [type, setType] = useState("deposit");
  const [date, setDate] = useState("");

  const initialFundFocusedRef = useRef(false);
  const initialFund = Number(initialFundInput || 0);

  useEffect(() => {
    if (initialFundFocusedRef.current) return;
    const incoming = formatNumberForInput(initialFundValue);
    setInitialFundInput((prev) => {
      const prevNumeric = Number(prev || 0);
      const incomingNumeric = Number(incoming || 0);
      if (prevNumeric === incomingNumeric) return prev;
      return incoming;
    });
  }, [initialFundValue]);

  useEffect(() => {
    setCashflows((prev) => {
      const next = Array.isArray(cashflowsValue) ? cashflowsValue : [];
      if (prev === next) return prev;
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [cashflowsValue]);

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
    <div className="ui-section">
      <h3>Account Summary</h3>

      <FormRow>
        <FormField label="Initial Fund">
          <TextInput
            type="number"
            step="0.01"
            value={initialFundInput}
            onChange={(e) => setInitialFundInput(e.target.value)}
            onFocus={() => {
              initialFundFocusedRef.current = true;
            }}
            onBlur={() => {
              initialFundFocusedRef.current = false;
            }}
            placeholder="e.g. 2650"
          />
        </FormField>

        <FormField label="Type">
          <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </SelectInput>
        </FormField>

        <FormField label="Amount">
          <TextInput
            type="number"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="e.g. 1000"
          />
        </FormField>

        <FormField label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>

        <ActionButton onClick={addCashflow}>Add</ActionButton>
      </FormRow>

      <div className="ui-card-grid">
        <SummaryMetricCard label="Initial Fund" value={initialFund} />
        <SummaryMetricCard label="Deposits" value={totalDeposits} />
        <SummaryMetricCard label="Withdrawals" value={totalWithdrawals} />
        <SummaryMetricCard label="Net Deposits" value={netDeposits} />
        <SummaryMetricCard label="Realized P&L" value={realizedPnl} />
        <SummaryMetricCard label="Estimated Equity" value={estimatedEquity} />
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
                    <ActionButton variant="ghost" size="sm" onClick={() => removeCashflow(item.id)}>
                      Delete
                    </ActionButton>
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

export default AccountSummary;
