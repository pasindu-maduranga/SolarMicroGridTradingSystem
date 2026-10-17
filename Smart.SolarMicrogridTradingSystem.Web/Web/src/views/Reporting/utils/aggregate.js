// Small helpers for building report totals on the client.

export function sum(rows, key) {
  return Math.round(rows.reduce((total, r) => total + (Number(r[key]) || 0), 0) * 100) / 100;
}
