import { Fragment, useEffect, useMemo, useState } from "react";
import { getTradeSummaryStorageKey } from "../utils/getTradeSummaryStorageKey";

const completedColumns = [
  { key: "underlying", label: "STOCK" },
  { key: "optionType", label: "TYPE" },
  { key: "strike", label: "STRIKE" },
  { key: "expiration", label: "EXPIRATION" },
  { key: "qty", label: "QTY" },
  { key: "entryPrice", label: "ENTRY" },
  { key: "exitPrice", label: "EXIT" },
  { key: "pnl", label: "P&L" },
];

const fillsColumns = [
  { key: "underlying", label: "STOCK" },
  { key: "optionType", label: "TYPE" },
  { key: "strike", label: "STRIKE" },
  { key: "expiration", label: "EXPIRATION" },
  { key: "side", label: "SIDE" },
  { key: "qty", label: "QTY" },
  { key: "price", label: "PRICE" },
];

const summaryColumns = [
  { key: "underlying", label: "STOCK" },
  { key: "optionType", label: "TYPE" },
  { key: "strike", label: "STRIKE" },
  { key: "qty", label: "QTY" },
  { key: "avgEntry", label: "AVG ENTRY" },
  { key: "avgExit", label: "AVG EXIT" },
  { key: "cost", label: "COST" },
  { key: "pnl", label: "P&L" },
  { key: "returnPct", label: "RETURN %" },
  { key: "strategy", label: "STRATEGY" },
  { key: "note", label: "NOTE" },
];

const dailyColumns = [
  { key: "label", label: "DAY" },
  { key: "trades", label: "TRADES" },
  { key: "wins", label: "WINS" },
  { key: "losses", label: "LOSSES" },
  { key: "winRate", label: "WIN RATE %" },
  { key: "pnl", label: "TOTAL P&L" },
  { key: "dayNote", label: "DAY NOTE" },
];

function getRowTime(row) {
  return row?.exitTime || row?.filledTime || row?.entryTime || null;
}

function getDayKey(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(dayKey) {
  if (dayKey === "Unknown") return "Unknown date";

  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) {
    return `Today (${dayKey})`;
  }

  if (target.getTime() === yesterday.getTime()) {
    return `Yesterday (${dayKey})`;
  }

  return dayKey;
}

function getWeekStartDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diffToMonday);
  return normalized;
}

function getIsoDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRightAlignedColumn(columnKey) {
  return [
    "qty",
    "strike",
    "entryPrice",
    "exitPrice",
    "price",
    "avgEntry",
    "avgExit",
    "cost",
    "pnl",
    "returnPct",
    "trades",
    "wins",
    "losses",
    "winRate",
  ].includes(columnKey);
}

function TradesTable({
  fills = [],
  completedTrades = [],
  tradeSummaries = [],
  tradeSummaryNotes = {},
  tradeSummaryStrategies = {},
  strategyOptions = [],
  dayNotes = {},
  onTradeSummaryNotesChange,
  onTradeSummaryStrategiesChange,
  onStrategyOptionsChange,
  onDayNotesChange,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState("completed");
  const [stockFilter, setStockFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [completedTradeNotes, setCompletedTradeNotes] = useState(tradeSummaryNotes);
  const [tradeStrategies, setTradeStrategies] = useState(tradeSummaryStrategies);
  const [tradeStrategyDrafts, setTradeStrategyDrafts] = useState(tradeSummaryStrategies);
  const [strategySaveSuccess, setStrategySaveSuccess] = useState({});
  const [dayNotesState, setDayNotesState] = useState(dayNotes);
  const [completedTradeDrafts, setCompletedTradeDrafts] = useState({});
  const [dayNoteDrafts, setDayNoteDrafts] = useState(dayNotes);
  const [editingCompletedNotes, setEditingCompletedNotes] = useState({});
  const [editingDayNotes, setEditingDayNotes] = useState({});

  useEffect(() => {
    const safe = tradeSummaryNotes || {};
    setCompletedTradeNotes(safe);
    setCompletedTradeDrafts((prev) => {
      const next = { ...safe };
      for (const [key, value] of Object.entries(prev)) {
        if (editingCompletedNotes[key]) {
          next[key] = value;
        }
      }
      return next;
    });
  }, [tradeSummaryNotes, editingCompletedNotes]);

  useEffect(() => {
    const safe = tradeSummaryStrategies || {};
    setTradeStrategies(safe);
    setTradeStrategyDrafts((prev) => {
      const next = { ...safe };
      for (const [key, value] of Object.entries(prev)) {
        const draftStr = String(value ?? "");
        const savedStr = String(safe[key] ?? "");
        if (draftStr !== savedStr) {
          next[key] = value;
        }
      }
      return next;
    });
  }, [tradeSummaryStrategies]);

  useEffect(() => {
    const safe = dayNotes || {};
    setDayNotesState(safe);
    setDayNoteDrafts((prev) => {
      const next = { ...safe };
      for (const [key, value] of Object.entries(prev)) {
        if (editingDayNotes[key]) {
          next[key] = value;
        }
      }
      return next;
    });
  }, [dayNotes, editingDayNotes]);

  const viewSourceRecords = useMemo(() => {
    let source = [];

    if (viewMode === "summary") source = tradeSummaries;
    else if (viewMode === "fills") source = fills;
    else if (viewMode === "completed") source = completedTrades;
    else source = tradeSummaries.length ? tradeSummaries : completedTrades;

    return Array.isArray(source) ? source : [];
  }, [viewMode, fills, completedTrades, tradeSummaries]);

  const filteredViewRecords = useMemo(() => {
    const safeSource = viewSourceRecords;

    return safeSource.filter((row) => {
      const matchesStock = stockFilter === "all" || row?.underlying === stockFilter;
      const matchesType = typeFilter === "all" || row?.optionType === typeFilter;
      return matchesStock && matchesType;
    });
  }, [viewSourceRecords, stockFilter, typeFilter]);

  const availableStocks = useMemo(() => {
    const unique = new Set(viewSourceRecords.map((row) => row?.underlying).filter(Boolean));
    return [...unique].sort((a, b) => String(a).localeCompare(String(b)));
  }, [viewSourceRecords]);

  useEffect(() => {
    setCurrentPage(1);
  }, [stockFilter, typeFilter, viewMode]);

  const displayedData = useMemo(() => {
    if (viewMode === "weekly") {
      const byWeek = new Map();

      for (const trade of filteredViewRecords) {
        const rowTime = getRowTime(trade);
        if (!rowTime) continue;

        const weekStart = getWeekStartDate(rowTime);
        if (!weekStart) continue;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekKey = getIsoDateString(weekStart);
        const bucket = byWeek.get(weekKey) || {
          weekKey,
          weekStart: new Date(weekStart),
          weekEnd: new Date(weekEnd),
          trades: 0,
          wins: 0,
          losses: 0,
          pnl: 0,
        };

        const pnl = Number(trade?.pnl || 0);
        bucket.trades += 1;
        bucket.pnl += pnl;
        if (pnl > 0) bucket.wins += 1;
        if (pnl < 0) bucket.losses += 1;

        byWeek.set(weekKey, bucket);
      }

      return [...byWeek.values()]
        .map((week) => ({
          ...week,
          pnl: Number(week.pnl.toFixed(2)),
          winRate: week.trades ? Number(((week.wins / week.trades) * 100).toFixed(1)) : 0,
          label: `${getIsoDateString(week.weekStart)} to ${getIsoDateString(week.weekEnd)}`,
        }))
        .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
    }

    if (viewMode === "daily") {
      const byDay = new Map();

      for (const trade of filteredViewRecords) {
        const dayKey = getDayKey(getRowTime(trade));
        const bucket = byDay.get(dayKey) || {
          dayKey,
          label: formatDayLabel(dayKey),
          trades: 0,
          wins: 0,
          losses: 0,
          pnl: 0,
        };

        bucket.trades += 1;
        bucket.pnl += Number(trade.pnl || 0);
        if (trade.pnl > 0) bucket.wins += 1;
        if (trade.pnl < 0) bucket.losses += 1;

        byDay.set(dayKey, bucket);
      }

      return [...byDay.values()]
        .map((day) => ({
          ...day,
          pnl: Number(day.pnl.toFixed(2)),
          winRate: day.trades ? Number(((day.wins / day.trades) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => {
          if (a.dayKey === "Unknown") return 1;
          if (b.dayKey === "Unknown") return -1;
          return new Date(b.dayKey).getTime() - new Date(a.dayKey).getTime();
        });
    }

    return [...filteredViewRecords].sort((a, b) => {
      const aTime = new Date(getRowTime(a)).getTime();
      const bTime = new Date(getRowTime(b)).getTime();
      return bTime - aTime;
    });
  }, [viewMode, filteredViewRecords]);

  let activeColumns;

  if (viewMode === "summary") activeColumns = summaryColumns;
  else if (viewMode === "weekly") activeColumns = [];
  else if (viewMode === "daily") activeColumns = dailyColumns;
  else if (viewMode === "fills") activeColumns = fillsColumns;
  else activeColumns = completedColumns;

  const totalPages = Math.ceil(displayedData.length / rowsPerPage);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return displayedData.slice(start, start + rowsPerPage);
  }, [displayedData, currentPage, rowsPerPage]);

  const dayPnlTotalsForPage = useMemo(() => {
    if (viewMode !== "summary") return new Map();

    const totals = new Map();
    for (const row of paginatedRows) {
      const dayKey = getDayKey(getRowTime(row));
      const pnl = Number(row?.pnl || 0);
      totals.set(dayKey, Number(((totals.get(dayKey) || 0) + pnl).toFixed(2)));
    }
    return totals;
  }, [viewMode, paginatedRows]);

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const saveCompletedTradeNote = (noteKey) => {
    const noteValue = (completedTradeDrafts[noteKey] || "").trim();
    const next = { ...completedTradeNotes };
    const nextDrafts = { ...completedTradeDrafts };

    if (!noteValue) {
      delete next[noteKey];
      delete nextDrafts[noteKey];
    } else {
      next[noteKey] = noteValue;
      nextDrafts[noteKey] = noteValue;
    }

    setCompletedTradeNotes(next);
    setCompletedTradeDrafts(nextDrafts);
    setEditingCompletedNotes((prev) => ({ ...prev, [noteKey]: false }));
    onTradeSummaryNotesChange?.(next);
  };

  const deleteCompletedTradeNote = (noteKey) => {
    const next = { ...completedTradeNotes };
    const nextDrafts = { ...completedTradeDrafts };
    delete next[noteKey];
    delete nextDrafts[noteKey];
    setCompletedTradeNotes(next);
    setCompletedTradeDrafts(nextDrafts);
    setEditingCompletedNotes((prev) => ({ ...prev, [noteKey]: false }));
    onTradeSummaryNotesChange?.(next);
  };

  const saveDayNote = (dayKey) => {
    const noteValue = (dayNoteDrafts[dayKey] || "").trim();
    const next = { ...dayNotesState };
    const nextDrafts = { ...dayNoteDrafts };

    if (!noteValue) {
      delete next[dayKey];
      delete nextDrafts[dayKey];
    } else {
      next[dayKey] = noteValue;
      nextDrafts[dayKey] = noteValue;
    }

    setDayNotesState(next);
    setDayNoteDrafts(nextDrafts);
    setEditingDayNotes((prev) => ({ ...prev, [dayKey]: false }));
    onDayNotesChange?.(next);
  };

  const deleteDayNote = (dayKey) => {
    const next = { ...dayNotesState };
    const nextDrafts = { ...dayNoteDrafts };
    delete next[dayKey];
    delete nextDrafts[dayKey];
    setDayNotesState(next);
    setDayNoteDrafts(nextDrafts);
    setEditingDayNotes((prev) => ({ ...prev, [dayKey]: false }));
    onDayNotesChange?.(next);
  };

  const strategySuggestions = Array.isArray(strategyOptions) ? strategyOptions : [];

  const saveTradeStrategy = (strategyKey) => {
    const draftValue = String(tradeStrategyDrafts[strategyKey] || "");
    const trimmedValue = draftValue.trim();
    const next = { ...tradeStrategies };

    if (trimmedValue) {
      next[strategyKey] = trimmedValue;
    } else {
      delete next[strategyKey];
    }

    setTradeStrategies(next);
    setTradeStrategyDrafts((prev) => ({
      ...prev,
      [strategyKey]: trimmedValue,
    }));
    setStrategySaveSuccess((prev) => ({ ...prev, [strategyKey]: true }));
    globalThis.setTimeout(() => {
      setStrategySaveSuccess((prev) => ({ ...prev, [strategyKey]: false }));
    }, 1200);
    onTradeSummaryStrategiesChange?.(next);

    if (trimmedValue) {
      const exists = strategySuggestions.some(
        (item) => String(item).trim().toLowerCase() === trimmedValue.toLowerCase(),
      );
      if (!exists) {
        onStrategyOptionsChange?.([...strategySuggestions, trimmedValue]);
      }
    }
  };

  const viewOptions = [
    { value: "summary", label: "Trade Summary" },
    { value: "weekly", label: "Weekly P&L" },
    { value: "daily", label: "Daily P&L" },
    { value: "completed", label: "Completed Trades" },
    { value: "fills", label: "Filled Rows" },
  ];

  return (
    <div className="tt-section">
      <div className="tt-controls">
        <div className="tt-view-tabs" role="tablist" aria-label="Table view mode">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              className={`tt-view-tab ${viewMode === option.value ? "tt-view-tab-active" : ""}`}
              onClick={() => {
                setViewMode(option.value);
                setCurrentPage(1);
              }}
              role="tab"
              aria-selected={viewMode === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="tt-control">
          Stock:{" "}
          <select className="tt-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">All</option>
            {availableStocks.map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>
        </label>

        <div className="tt-control">
          Type:
          <div className="tt-type-tabs" role="tablist" aria-label="Option type filter">
            {[
              { value: "all", label: "All" },
              { value: "call", label: "CALL" },
              { value: "put", label: "PUT" },
            ].map((option) => (
              <button
                key={option.value}
                className={`tt-view-tab ${typeFilter === option.value ? "tt-view-tab-active" : ""}`}
                onClick={() => setTypeFilter(option.value)}
                role="tab"
                aria-selected={typeFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {viewMode !== "weekly" && (
          <label className="tt-control">
            Rows per page:{" "}
            <select className="tt-select" value={rowsPerPage} onChange={handleRowsPerPageChange}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        )}

        {viewMode !== "weekly" && (
          <span className="tt-page-info">
            Page {currentPage} of {totalPages || 1}
          </span>
        )}
      </div>

      {viewMode === "weekly" ? (
        <div className="tt-week-grid">
          {displayedData.length === 0 && <div className="tt-week-empty">No weekly data for the selected filters.</div>}
          {displayedData.map((week) => (
            <div
              key={week.weekKey}
              className={`tt-week-card ${
                week.pnl > 0 ? "tt-week-card-profit" : week.pnl < 0 ? "tt-week-card-loss" : "tt-week-card-flat"
              }`}
            >
              <div className="tt-week-range">{week.label}</div>
              <div className="tt-week-pnl">${week.pnl.toFixed(2)}</div>
              <div className="tt-week-meta">Win Rate: {week.winRate.toFixed(1)}%</div>
              <div className="tt-week-meta">
                Trades: {week.trades} ({week.wins}W / {week.losses}L)
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tt-table-wrap">
        <table className="tt-table">
          <thead>
            <tr>
              <th className="tt-th tt-index-col">#</th>
              {activeColumns.map((col) => (
                <th key={col.key} className={`tt-th ${isRightAlignedColumn(col.key) ? "tt-right" : ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => {
              const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
              const dayKey = viewMode === "daily" ? null : getDayKey(getRowTime(row));
              const prevDayKey =
                viewMode === "daily" || index === 0 ? null : getDayKey(getRowTime(paginatedRows[index - 1]));
              const nextDayKey =
                viewMode === "daily" || index === paginatedRows.length - 1
                  ? null
                  : getDayKey(getRowTime(paginatedRows[index + 1]));
              const showDaySeparator = viewMode !== "daily" && dayKey !== prevDayKey;
              const showDayTotal = viewMode === "summary" && dayKey !== nextDayKey;
              const dayTotalPnl = dayPnlTotalsForPage.get(dayKey) || 0;

              return (
                <Fragment key={`group-${dayKey || "daily"}-${index}`}>
                  {showDaySeparator && (
                    <tr key={`separator-${dayKey}-${index}`} className="tt-day-separator">
                      <td colSpan={activeColumns.length + 1}>
                        {formatDayLabel(dayKey)}
                      </td>
                    </tr>
                  )}
                  <tr key={`row-${dayKey || "daily"}-${index}`} className="tt-row">
                    <td className="tt-cell tt-index">{rowNumber}</td>

                    {activeColumns.map((col) => {
                      const value = row[col.key];

                      if (col.key === "returnPct") {
                        return (
                          <td
                            key={col.key}
                            className="tt-cell tt-right"
                            style={{
                              color: value > 0 ? "green" : value < 0 ? "red" : "black",
                              fontWeight: "bold",
                            }}
                          >
                            {Number(value || 0).toFixed(2)}%
                          </td>
                        );
                      }

                      if (col.key === "winRate") {
                        return (
                          <td
                            key={col.key}
                            className="tt-cell tt-right"
                            style={{
                              color: value > 0 ? "green" : value < 0 ? "red" : "black",
                              fontWeight: "bold",
                            }}
                          >
                            {Number(value || 0).toFixed(1)}%
                          </td>
                        );
                      }

                      if (col.key === "pnl") {
                        return (
                          <td
                            key={col.key}
                            className="tt-cell tt-right"
                            style={{
                              color: value > 0 ? "green" : value < 0 ? "red" : "black",
                              fontWeight: "bold",
                            }}
                          >
                            ${Number(value || 0).toFixed(2)}
                          </td>
                        );
                      }

                    if (col.key === "note" && viewMode === "summary") {
                      const noteKey = getTradeSummaryStorageKey(row);
                      const savedNoteValue = completedTradeNotes[noteKey] || "";
                      const draftNoteValue = completedTradeDrafts[noteKey] ?? savedNoteValue;
                      const isEditing = Boolean(editingCompletedNotes[noteKey]);

                      if (!isEditing && savedNoteValue.trim()) {
                        return (
                          <td key={col.key} className="tt-cell tt-note-cell">
                            <div className="tt-note-shell">
                              <div className="tt-note-actions tt-note-actions-corner">
                                <button
                                  className="tt-btn tt-btn-sm tt-icon-btn"
                                  title="Edit note"
                                  aria-label="Edit note"
                                  onClick={() => {
                                    setCompletedTradeDrafts((prev) => ({
                                      ...prev,
                                      [noteKey]: savedNoteValue,
                                    }));
                                    setEditingCompletedNotes((prev) => ({ ...prev, [noteKey]: true }));
                                  }}
                                >
                                  <span aria-hidden="true">✎</span>
                                </button>
                                <button
                                  className="tt-btn tt-btn-ghost tt-btn-sm tt-icon-btn"
                                  title="Delete note"
                                  aria-label="Delete note"
                                  onClick={() => deleteCompletedTradeNote(noteKey)}
                                >
                                  <span aria-hidden="true">🗑</span>
                                </button>
                              </div>
                              <div className="tt-note-text">{savedNoteValue}</div>
                            </div>
                          </td>
                        );
                      }

                      if (!isEditing) {
                        return (
                          <td key={col.key} className="tt-cell tt-note-cell">
                            <div className="tt-note-shell">
                              <div className="tt-note-actions tt-note-actions-corner">
                                <button
                                  className="tt-btn tt-btn-sm tt-icon-btn"
                                  title="Add note"
                                  aria-label="Add note"
                                  onClick={() => {
                                    setCompletedTradeDrafts((prev) => ({
                                      ...prev,
                                      [noteKey]: savedNoteValue,
                                    }));
                                    setEditingCompletedNotes((prev) => ({ ...prev, [noteKey]: true }));
                                  }}
                                >
                                  <span aria-hidden="true">＋</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="tt-cell tt-note-cell">
                          <div className="tt-note-shell">
                            <div className="tt-note-actions tt-note-actions-corner">
                              <button
                                className="tt-btn tt-btn-sm tt-icon-btn"
                                title="Save note"
                                aria-label="Save note"
                                onClick={() => saveCompletedTradeNote(noteKey)}
                              >
                                <span aria-hidden="true">✓</span>
                              </button>
                              <button
                                className="tt-btn tt-btn-ghost tt-btn-sm tt-icon-btn"
                                title="Cancel edit"
                                aria-label="Cancel edit"
                                onClick={() => {
                                  setCompletedTradeDrafts((prev) => ({
                                    ...prev,
                                    [noteKey]: savedNoteValue,
                                  }));
                                  setEditingCompletedNotes((prev) => ({ ...prev, [noteKey]: false }));
                                }}
                              >
                                <span aria-hidden="true">✕</span>
                              </button>
                              <button
                                className="tt-btn tt-btn-ghost tt-btn-sm tt-icon-btn"
                                title="Delete note"
                                aria-label="Delete note"
                                onClick={() => deleteCompletedTradeNote(noteKey)}
                                disabled={!savedNoteValue.trim()}
                              >
                                <span aria-hidden="true">🗑</span>
                              </button>
                            </div>
                            <textarea
                              className="tt-note-input"
                              value={draftNoteValue}
                              onChange={(event) =>
                                setCompletedTradeDrafts((prev) => ({
                                  ...prev,
                                  [noteKey]: event.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="Add note..."
                            />
                          </div>
                        </td>
                      );
                    }

                    if (col.key === "strategy" && viewMode === "summary") {
                      const strategyKey = getTradeSummaryStorageKey(row);
                      const strategyValue = tradeStrategyDrafts[strategyKey] ?? tradeStrategies[strategyKey] ?? "";
                      const savedValue = tradeStrategies[strategyKey] || "";
                      const hasChanged = strategyValue.trim() !== savedValue.trim();
                      const savedJustNow = Boolean(strategySaveSuccess[strategyKey]);

                      return (
                        <td key={col.key} className="tt-cell tt-strategy-cell">
                          <div className="tt-strategy-wrap">
                            <input
                              className="tt-strategy-input"
                              list="tt-strategy-options"
                              value={strategyValue}
                              onChange={(event) =>
                                setTradeStrategyDrafts((prev) => ({
                                  ...prev,
                                  [strategyKey]: event.target.value,
                                }))
                              }
                              placeholder="Select or type strategy"
                            />
                            <button
                              className={`tt-btn tt-btn-sm tt-icon-btn ${savedJustNow ? "tt-icon-btn-success" : ""}`}
                              title="Save strategy"
                              aria-label="Save strategy"
                              onClick={() => saveTradeStrategy(strategyKey)}
                              disabled={!hasChanged}
                            >
                              <span aria-hidden="true">✓</span>
                            </button>
                          </div>
                        </td>
                      );
                    }

                    if (col.key === "dayNote" && viewMode === "daily") {
                      const dayKeyForNote = row.dayKey;
                      const savedNoteValue = dayNotesState[dayKeyForNote] || "";
                      const draftNoteValue = dayNoteDrafts[dayKeyForNote] ?? savedNoteValue;
                      const isEditing = Boolean(editingDayNotes[dayKeyForNote]);

                      if (!isEditing && savedNoteValue.trim()) {
                        return (
                          <td key={col.key} className="tt-cell tt-note-cell">
                            <div className="tt-note-shell">
                              <div className="tt-note-actions tt-note-actions-corner">
                                <button
                                  className="tt-btn tt-btn-sm tt-icon-btn"
                                  title="Edit note"
                                  aria-label="Edit note"
                                  onClick={() => {
                                    setDayNoteDrafts((prev) => ({
                                      ...prev,
                                      [dayKeyForNote]: savedNoteValue,
                                    }));
                                    setEditingDayNotes((prev) => ({ ...prev, [dayKeyForNote]: true }));
                                  }}
                                >
                                  <span aria-hidden="true">✎</span>
                                </button>
                                <button
                                  className="tt-btn tt-btn-ghost tt-btn-sm tt-icon-btn"
                                  title="Delete note"
                                  aria-label="Delete note"
                                  onClick={() => deleteDayNote(dayKeyForNote)}
                                >
                                  <span aria-hidden="true">🗑</span>
                                </button>
                              </div>
                              <div className="tt-note-text">{savedNoteValue}</div>
                            </div>
                          </td>
                        );
                      }

                      if (!isEditing) {
                        return (
                          <td key={col.key} className="tt-cell tt-note-cell">
                            <div className="tt-note-shell">
                              <div className="tt-note-actions tt-note-actions-corner">
                                <button
                                  className="tt-btn tt-btn-sm tt-icon-btn"
                                  title="Add note"
                                  aria-label="Add note"
                                  onClick={() => {
                                    setDayNoteDrafts((prev) => ({
                                      ...prev,
                                      [dayKeyForNote]: savedNoteValue,
                                    }));
                                    setEditingDayNotes((prev) => ({ ...prev, [dayKeyForNote]: true }));
                                  }}
                                >
                                  <span aria-hidden="true">＋</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="tt-cell tt-note-cell">
                          <div className="tt-note-shell">
                            <div className="tt-note-actions tt-note-actions-corner">
                              <button
                                className="tt-btn tt-btn-sm tt-icon-btn"
                                title="Save note"
                                aria-label="Save note"
                                onClick={() => saveDayNote(dayKeyForNote)}
                              >
                                <span aria-hidden="true">✓</span>
                              </button>
                              <button
                                className="tt-btn tt-btn-ghost tt-btn-sm tt-icon-btn"
                                title="Cancel edit"
                                aria-label="Cancel edit"
                                onClick={() => {
                                  setDayNoteDrafts((prev) => ({
                                    ...prev,
                                    [dayKeyForNote]: savedNoteValue,
                                  }));
                                  setEditingDayNotes((prev) => ({ ...prev, [dayKeyForNote]: false }));
                                }}
                              >
                                <span aria-hidden="true">✕</span>
                              </button>
                              <button
                                className="tt-btn tt-btn-ghost tt-btn-sm tt-icon-btn"
                                title="Delete note"
                                aria-label="Delete note"
                                onClick={() => deleteDayNote(dayKeyForNote)}
                                disabled={!savedNoteValue.trim()}
                              >
                                <span aria-hidden="true">🗑</span>
                              </button>
                            </div>
                            <textarea
                              className="tt-note-input"
                              value={draftNoteValue}
                              onChange={(event) =>
                                setDayNoteDrafts((prev) => ({
                                  ...prev,
                                  [dayKeyForNote]: event.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="Add day note..."
                            />
                          </div>
                        </td>
                      );
                    }

                      if (col.key === "optionType") {
                        return <td className="tt-cell" key={col.key}>{value === "call" ? "CALL" : "PUT"}</td>;
                      }

                      if (
                        col.key === "entryPrice" ||
                        col.key === "exitPrice" ||
                        col.key === "price" ||
                        col.key === "avgEntry" ||
                        col.key === "avgExit" ||
                        col.key === "cost"
                      ) {
                        return (
                          <td className="tt-cell tt-right" key={col.key}>
                            ${Number(value || 0).toFixed(2)}
                          </td>
                        );
                      }

                      if (col.key === "side") {
                        return <td className="tt-cell" key={col.key}>{String(value || "").toUpperCase()}</td>;
                      }

                      return (
                        <td className={`tt-cell ${isRightAlignedColumn(col.key) ? "tt-right" : ""}`} key={col.key}>
                          {String(value ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                  {showDayTotal && (() => {
                    const pnlIndex = activeColumns.findIndex((col) => col.key === "pnl");
                    const totalColumns = activeColumns.length + 1; // include index column
                    const labelSpan = pnlIndex >= 0 ? pnlIndex + 1 : totalColumns - 1;
                    const trailingSpan = Math.max(0, totalColumns - labelSpan - 1);

                    return (
                      <tr className="tt-day-total-row" key={`subtotal-${dayKey}-${index}`}>
                        <td colSpan={labelSpan} className="tt-day-total-label">
                          Day Total P&L
                        </td>
                        <td
                          className="tt-day-total-value"
                          style={{
                            color: dayTotalPnl > 0 ? "green" : dayTotalPnl < 0 ? "red" : "var(--text-h)",
                          }}
                        >
                          ${Number(dayTotalPnl).toFixed(2)}
                        </td>
                        {trailingSpan > 0 && <td colSpan={trailingSpan} className="tt-day-total-tail" />}
                      </tr>
                    );
                  })()}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <datalist id="tt-strategy-options">
          {strategySuggestions.map((strategy) => (
            <option key={strategy} value={strategy} />
          ))}
        </datalist>
      </div>
      )}

      {viewMode !== "weekly" && (
        <div className="tt-pagination">
          <button
            className="tt-btn tt-btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <button
            className="tt-btn tt-btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default TradesTable;
