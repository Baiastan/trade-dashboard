import { useMemo, useState } from "react";

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
];

function TradesTable({ fills = [], completedTrades = [], tradeSummaries = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState("completed");

  const displayedData = useMemo(() => {
    let data = [];

    if (viewMode === "summary") data = tradeSummaries;
    else if (viewMode === "fills") data = fills;
    else data = completedTrades;

    return [...(Array.isArray(data) ? data : [])].sort((a, b) => {
      const aTime = new Date(a.exitTime || a.filledTime).getTime();
      const bTime = new Date(b.exitTime || b.filledTime).getTime();
      return bTime - aTime;
    });
  }, [viewMode, fills, completedTrades, tradeSummaries]);

  let activeColumns;

  if (viewMode === "summary") activeColumns = summaryColumns;
  else if (viewMode === "fills") activeColumns = fillsColumns;
  else activeColumns = completedColumns;

  const totalPages = Math.ceil(displayedData.length / rowsPerPage);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return displayedData.slice(start, start + rowsPerPage);
  }, [displayedData, currentPage, rowsPerPage]);

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <label>
          View:{" "}
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="summary">Trade Summary</option>
            <option value="completed">Completed Trades</option>
            <option value="fills">Filled Rows</option>
          </select>
        </label>

        <label>
          Rows per page:{" "}
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>#</th>
              {activeColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={index}>
                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>

                {activeColumns.map((col) => {
                  const value = row[col.key];

                  if (col.key === "returnPct") {
                    return (
                      <td
                        key={col.key}
                        style={{
                          color: value > 0 ? "green" : value < 0 ? "red" : "black",
                          fontWeight: "bold",
                        }}
                      >
                        {Number(value || 0).toFixed(2)}%
                      </td>
                    );
                  }

                  if (col.key === "pnl") {
                    return (
                      <td
                        key={col.key}
                        style={{
                          color: value > 0 ? "green" : value < 0 ? "red" : "black",
                          fontWeight: "bold",
                        }}
                      >
                        ${Number(value || 0).toFixed(2)}
                      </td>
                    );
                  }

                  if (col.key === "optionType") {
                    return <td key={col.key}>{value === "call" ? "CALL" : "PUT"}</td>;
                  }

                  if (
                    col.key === "entryPrice" ||
                    col.key === "exitPrice" ||
                    col.key === "price" ||
                    col.key === "avgEntry" ||
                    col.key === "avgExit" ||
                    col.key === "cost"
                  ) {
                    return <td key={col.key}>${Number(value || 0).toFixed(2)}</td>;
                  }

                  if (col.key === "side") {
                    return <td key={col.key}>{String(value || "").toUpperCase()}</td>;
                  }

                  return <td key={col.key}>{String(value ?? "")}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TradesTable;
