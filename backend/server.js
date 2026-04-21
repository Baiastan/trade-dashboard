import express from "express";
import cors from "cors";
import { readJsonState, writeJsonState } from "./db.js";

const PORT = Number(globalThis.process?.env?.PORT || 8787);
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/account-data", (_req, res) => {
  const accountData = readJsonState("accountData", {
    initialFund: 0,
    cashflows: [],
    brokerBalance: 0,
    hasBrokerBalance: false,
  });
  res.json(accountData);
});

app.put("/api/account-data", (req, res) => {
  const payload = req.body || {};
  const accountData = {
    initialFund: Number(payload.initialFund || 0),
    cashflows: Array.isArray(payload.cashflows) ? payload.cashflows : [],
    brokerBalance: Number(payload.brokerBalance || 0),
    hasBrokerBalance: Boolean(payload.hasBrokerBalance),
  };
  writeJsonState("accountData", accountData);
  res.json({ ok: true });
});

app.get("/api/notes", (_req, res) => {
  const notes = readJsonState("notes", {
    tradeSummaryNotes: {},
    tradeSummaryStrategies: {},
    dayNotes: {},
  });
  res.json(notes);
});

app.put("/api/notes", (req, res) => {
  const payload = req.body || {};
  const notes = {
    tradeSummaryNotes:
      payload.tradeSummaryNotes && typeof payload.tradeSummaryNotes === "object"
        ? payload.tradeSummaryNotes
        : {},
    tradeSummaryStrategies:
      payload.tradeSummaryStrategies && typeof payload.tradeSummaryStrategies === "object"
        ? payload.tradeSummaryStrategies
        : {},
    dayNotes: payload.dayNotes && typeof payload.dayNotes === "object" ? payload.dayNotes : {},
  };
  writeJsonState("notes", notes);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Trade dashboard backend listening on http://localhost:${PORT}`);
});
