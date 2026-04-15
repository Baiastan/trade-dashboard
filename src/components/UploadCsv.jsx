import { useState } from "react";
import Papa from "papaparse";
import { parseWebullRows } from "../utils/parseWebullCsv";
import { buildCompletedTrades } from "../utils/buildCompletedTrades";
import TradeStats from "./TradeStats";
import TradesTable from "./TradesTable";
import AccountSummary from "./AccountSummary";
import ReconciliationSummary from "./ReconciliationSummary";
import OptionTypeAnalysis from "./OptionTypeAnalysis";
import { buildTradeSummaries } from "../utils/buildTradeSummaries";
import TradeBehaviorStats from "./TradeBehaviorStats";
import TradeCostStats from "./TradeCostStats";

function UploadCsv() {
  const [rows, setRows] = useState([]);
  const [fills, setFills] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [fileName, setFileName] = useState("");
  const [tradeSummaries, setTradeSummaries] = useState([]);
  const [accountData, setAccountData] = useState({
    initialFund: 0,
    cashflows: [],
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data;
        const parsedFills = parseWebullRows(parsedRows);
        const parsedCompletedTrades = buildCompletedTrades(parsedFills);
        const parsedTradeSummaries = buildTradeSummaries(parsedFills);

        setRows(parsedRows);
        setFills(parsedFills);
        setCompletedTrades(parsedCompletedTrades);
        setTradeSummaries(parsedTradeSummaries);
      },
      error: (error) => {
        console.error("CSV parse error:", error);
      },
    });
  };

  console.log("tradeSummaries state:", tradeSummaries);

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Webull CSV</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      {fileName && (
        <p>
          <strong>File:</strong> {fileName}
        </p>
      )}

      <p>
        <strong>Total CSV rows:</strong> {rows.length}
      </p>
      <p>
        <strong>Filled rows only:</strong> {fills.length}
      </p>
      <p>
        <strong>Completed trades:</strong> {completedTrades.length}
      </p>

      {completedTrades.length > 0 && (
        <>
          <TradeStats completedTrades={completedTrades} />
          <OptionTypeAnalysis completedTrades={completedTrades} />

          <AccountSummary completedTrades={completedTrades} onAccountDataChange={setAccountData} />

          <ReconciliationSummary
            initialFund={accountData.initialFund}
            cashflows={accountData.cashflows}
            completedTrades={completedTrades}
          />
        </>
      )}
      <TradeBehaviorStats tradeSummaries={tradeSummaries} />
      <TradeCostStats tradeSummaries={tradeSummaries} />
      {(fills.length > 0 || completedTrades.length > 0) && (
        <TradesTable fills={fills} completedTrades={completedTrades} tradeSummaries={tradeSummaries} />
      )}
    </div>
  );
}

export default UploadCsv;
