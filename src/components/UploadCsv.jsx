import { useMemo, useRef, useState } from "react";
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
import { ActionButton } from "./ui/FormControls";
import AccountProgressChart from "./AccountProgressChart";

function UploadCsv() {
  const [rows, setRows] = useState([]);
  const [fills, setFills] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [fileName, setFileName] = useState("");
  const [tradeSummaries, setTradeSummaries] = useState([]);
  const [accountData, setAccountData] = useState(() => {
    const initialFund = Number(localStorage.getItem("initialFund") || 0);
    const savedCashflows = localStorage.getItem("cashflows");
    const cashflows = savedCashflows ? JSON.parse(savedCashflows) : [];
    const brokerBalanceRaw = localStorage.getItem("brokerBalance") || "";
    return {
      initialFund,
      cashflows,
      brokerBalance: Number(brokerBalanceRaw || 0),
      hasBrokerBalance: brokerBalanceRaw !== "",
    };
  });
  const [activeTab, setActiveTab] = useState("analysis");
  const [analysisStockFilter, setAnalysisStockFilter] = useState("all");
  const fileInputRef = useRef(null);

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

  const analysisStocks = useMemo(() => {
    const source = tradeSummaries.length ? tradeSummaries : completedTrades;
    const unique = new Set(source.map((item) => item?.underlying).filter(Boolean));
    return [...unique].sort((a, b) => String(a).localeCompare(String(b)));
  }, [tradeSummaries, completedTrades]);

  const filteredTradeSummaries = useMemo(() => {
    if (analysisStockFilter === "all") return tradeSummaries;
    return tradeSummaries.filter((trade) => trade.underlying === analysisStockFilter);
  }, [tradeSummaries, analysisStockFilter]);

  const filteredCompletedTrades = useMemo(() => {
    if (analysisStockFilter === "all") return completedTrades;
    return completedTrades.filter((trade) => trade.underlying === analysisStockFilter);
  }, [completedTrades, analysisStockFilter]);

  const stockDistribution = useMemo(() => {
    const source = tradeSummaries.length ? tradeSummaries : completedTrades;
    if (!source.length) return [];

    const counts = new Map();
    for (const trade of source) {
      const ticker = trade?.underlying;
      if (!ticker) continue;
      counts.set(ticker, (counts.get(ticker) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([ticker, count]) => ({
        ticker,
        count,
        pct: source.length ? Number(((count / source.length) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count || String(a.ticker).localeCompare(String(b.ticker)));
  }, [tradeSummaries, completedTrades]);

  return (
    <div className="ui-page">
      <div className="ui-upload-card">
        <div className="ui-upload-header">
          <h2>Upload Webull CSV</h2>
          <p className="ui-upload-subtitle">Choose your exported Webull CSV to refresh dashboard data.</p>
        </div>

        <div className="ui-upload-actions">
          <input
            ref={fileInputRef}
            className="ui-file-input-hidden"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
          <ActionButton onClick={() => fileInputRef.current?.click()}>Choose CSV File</ActionButton>
          <span className="ui-upload-file-name">{fileName || "No file selected"}</span>
        </div>

        <div className="ui-upload-stats">
          <span className="ui-upload-stat">Rows: {rows.length}</span>
          <span className="ui-upload-stat">Order fills: {fills.length}</span>
          <span className="ui-upload-stat">Full trades: {tradeSummaries.length}</span>
        </div>

        <div className="ui-stock-distribution">
          <span className="ui-stock-distribution-label">Stock mix:</span>
          {stockDistribution.length === 0 ? (
            <span className="ui-upload-stat">No trades yet</span>
          ) : (
            stockDistribution.map((item) => (
              <span key={item.ticker} className="ui-upload-stat-highlight">
                {item.ticker}: {item.count} ({item.pct.toFixed(1)}%)
              </span>
            ))
          )}
        </div>
      </div>

      <div className="ui-tab-row">
        <ActionButton
          size="sm"
          variant={activeTab === "analysis" ? "primary" : "ghost"}
          onClick={() => setActiveTab("analysis")}
        >
          Trading Analysis
        </ActionButton>
        <ActionButton
          size="sm"
          variant={activeTab === "account" ? "primary" : "ghost"}
          onClick={() => setActiveTab("account")}
        >
          Account & Reconciliation
        </ActionButton>
        <ActionButton
          size="sm"
          variant={activeTab === "progress" ? "primary" : "ghost"}
          onClick={() => setActiveTab("progress")}
        >
          Progress Chart
        </ActionButton>
      </div>

      {activeTab === "analysis" && (
        <>
          <div className="ui-analysis-filter-row">
            <label className="ui-label" htmlFor="analysis-stock-filter">
              Analysis Stock
            </label>
            <select
              id="analysis-stock-filter"
              className="ui-select"
              value={analysisStockFilter}
              onChange={(event) => setAnalysisStockFilter(event.target.value)}
            >
              <option value="all">All Stocks</option>
              {analysisStocks.map((stock) => (
                <option key={stock} value={stock}>
                  {stock}
                </option>
              ))}
            </select>
          </div>

          {(tradeSummaries.length > 0 || completedTrades.length > 0) && (
            <>
              <TradeStats completedTrades={filteredCompletedTrades} tradeSummaries={filteredTradeSummaries} />
              <OptionTypeAnalysis completedTrades={filteredCompletedTrades} tradeSummaries={filteredTradeSummaries} />
            </>
          )}
          <TradeBehaviorStats tradeSummaries={filteredTradeSummaries} />
          <TradeCostStats tradeSummaries={filteredTradeSummaries} />
          {(fills.length > 0 || completedTrades.length > 0) && (
            <TradesTable fills={fills} completedTrades={completedTrades} tradeSummaries={tradeSummaries} />
          )}
        </>
      )}

      {activeTab === "account" && (
        <>
          <AccountSummary
            completedTrades={completedTrades}
            onAccountDataChange={(nextData) => setAccountData((prev) => ({ ...prev, ...nextData }))}
          />
          <ReconciliationSummary
            initialFund={accountData.initialFund}
            cashflows={accountData.cashflows}
            completedTrades={completedTrades}
            onBrokerBalanceChange={(balanceInput) =>
              setAccountData((prev) => ({
                ...prev,
                brokerBalance: Number(balanceInput || 0),
                hasBrokerBalance: String(balanceInput || "").trim() !== "",
              }))
            }
          />
        </>
      )}

      {activeTab === "progress" && (
        <AccountProgressChart
          tradeSummaries={tradeSummaries}
          completedTrades={completedTrades}
          initialFund={accountData.initialFund}
          cashflows={accountData.cashflows}
          manualEndBalance={accountData.brokerBalance}
          hasManualEndBalance={accountData.hasBrokerBalance}
        />
      )}
    </div>
  );
}

export default UploadCsv;
