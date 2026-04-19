function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function FormRow({ children }) {
  return <div className="ui-form-row">{children}</div>;
}

export function FormField({ label, children }) {
  return (
    <div className="ui-field">
      <label className="ui-label">{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ className, ...props }) {
  return <input className={joinClassNames("ui-input", className)} {...props} />;
}

export function SelectInput({ className, children, ...props }) {
  return (
    <select className={joinClassNames("ui-select", className)} {...props}>
      {children}
    </select>
  );
}

export function ActionButton({ variant = "primary", size = "md", className, children, ...props }) {
  return (
    <button className={joinClassNames("ui-btn", `ui-btn-${variant}`, `ui-btn-${size}`, className)} {...props}>
      {children}
    </button>
  );
}

export function SummaryMetricCard({ label, value, customColor }) {
  const numericValue = Number(value || 0);
  const displayColor = customColor || (numericValue > 0 ? "green" : numericValue < 0 ? "red" : "black");

  return (
    <div className="ui-summary-card">
      <div className="ui-summary-label">{label}</div>
      <strong className="ui-summary-value" style={{ color: displayColor }}>
        ${numericValue.toFixed(2)}
      </strong>
    </div>
  );
}
