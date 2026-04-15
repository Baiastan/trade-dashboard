export function parseOptionSymbol(symbol) {
  if (!symbol) return null;

  const match = symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) return null;

  const [, underlying, date, type, strikeRaw] = match;

  const year = "20" + date.slice(0, 2);
  const month = date.slice(2, 4);
  const day = date.slice(4, 6);

  const expiration = `${year}-${month}-${day}`;

  const strike = Number(strikeRaw) / 1000;

  return {
    underlying,
    type: type === "C" ? "call" : "put",
    expiration,
    strike,
  };
}
