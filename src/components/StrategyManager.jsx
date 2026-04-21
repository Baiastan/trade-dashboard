import { useMemo, useState } from "react";
import { ActionButton, FormField, TextInput } from "./ui/FormControls";

function normalize(value) {
  return String(value || "").trim();
}

function StrategyManager({ strategyOptions = [], strategyMap = {}, onStrategyOptionsChange, onStrategyMapChange }) {
  const [newStrategy, setNewStrategy] = useState("");
  const [drafts, setDrafts] = useState({});

  const sortedOptions = useMemo(() => {
    return [...strategyOptions].sort((a, b) => String(a).localeCompare(String(b)));
  }, [strategyOptions]);

  const usageCounts = useMemo(() => {
    const counts = new Map();
    for (const value of Object.values(strategyMap || {})) {
      const key = normalize(value);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [strategyMap]);

  const addStrategy = () => {
    const next = normalize(newStrategy);
    if (!next) return;

    const exists = sortedOptions.some((item) => normalize(item).toLowerCase() === next.toLowerCase());
    if (exists) return;

    onStrategyOptionsChange?.([...sortedOptions, next]);
    setNewStrategy("");
  };

  const renameStrategy = (oldName) => {
    const oldNormalized = normalize(oldName);
    const nextName = normalize(drafts[oldName] ?? oldName);
    if (!nextName || nextName === oldNormalized) return;

    const duplicate = sortedOptions.some(
      (item) => normalize(item).toLowerCase() === nextName.toLowerCase() && normalize(item) !== oldNormalized,
    );
    if (duplicate) return;

    const nextOptions = sortedOptions.map((item) => (normalize(item) === oldNormalized ? nextName : item));
    const nextMap = {};
    for (const [key, value] of Object.entries(strategyMap || {})) {
      nextMap[key] = normalize(value) === oldNormalized ? nextName : value;
    }

    onStrategyOptionsChange?.(nextOptions);
    onStrategyMapChange?.(nextMap);
    setDrafts((prev) => ({ ...prev, [oldName]: nextName }));
  };

  const deleteStrategy = (targetName) => {
    const target = normalize(targetName);
    if (!target) return;

    const nextOptions = sortedOptions.filter((item) => normalize(item) !== target);
    const nextMap = {};
    for (const [key, value] of Object.entries(strategyMap || {})) {
      if (normalize(value) === target) continue;
      nextMap[key] = value;
    }

    onStrategyOptionsChange?.(nextOptions);
    onStrategyMapChange?.(nextMap);
  };

  return (
    <div className="ui-section">
      <h3>Strategy Manager</h3>

      <div className="strategy-manager-add">
        <FormField label="Add Strategy">
          <TextInput
            value={newStrategy}
            onChange={(event) => setNewStrategy(event.target.value)}
            placeholder="e.g. Opening Range Breakout"
          />
        </FormField>
        <ActionButton onClick={addStrategy}>Add</ActionButton>
      </div>

      {sortedOptions.length === 0 ? (
        <div className="strategy-empty">No strategy options saved yet.</div>
      ) : (
        <div className="strategy-manager-list">
          {sortedOptions.map((option) => {
            const usageCount = usageCounts.get(normalize(option)) || 0;
            const currentDraft = drafts[option] ?? option;

            return (
              <div key={option} className="strategy-manager-row">
                <TextInput
                  value={currentDraft}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [option]: event.target.value,
                    }))
                  }
                />
                <span className="strategy-manager-usage">Used in {usageCount} trade{usageCount === 1 ? "" : "s"}</span>
                <ActionButton size="sm" onClick={() => renameStrategy(option)}>
                  Rename
                </ActionButton>
                <ActionButton size="sm" variant="ghost" onClick={() => deleteStrategy(option)}>
                  Delete
                </ActionButton>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StrategyManager;
