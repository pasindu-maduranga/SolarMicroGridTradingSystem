// Shared formatting for the Reports module. A column is described once -
// { key, label, type, width? } - and the on-screen table, the PDF and the Excel export
// all format it the same way from here.
//
// Types: text | number | integer | kwh | currency | percent | date | datetime | status

const numberFmt = new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integerFmt = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 });

export const NUMERIC_TYPES = ['number', 'integer', 'kwh', 'currency', 'percent'];

export function isNumeric(type) {
  return NUMERIC_TYPES.includes(type);
}

export function formatValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  switch (type) {
    case 'number':
      return numberFmt.format(value);
    case 'integer':
      return integerFmt.format(value);
    case 'kwh':
      return numberFmt.format(value) + ' kWh';
    case 'currency':
      return 'Rs. ' + numberFmt.format(value);
    case 'percent':
      return Number(value).toFixed(1) + '%';
    case 'date':
      return formatDate(value);
    case 'datetime':
      return formatDateTime(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

// Fixed month names - some browsers' en-GB locale prints "Sept", others "Sep".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');

export function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return pad2(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

export function formatDateTime(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return formatDate(d) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

// yyyy-MM-dd in the viewer's local time (what <input type="date"> and the API expect).
export function toInputDate(date) {
  const d = new Date(date);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function describeRange(from, to) {
  return formatDate(from + 'T00:00:00') + '  –  ' + formatDate(to + 'T00:00:00');
}

export function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
