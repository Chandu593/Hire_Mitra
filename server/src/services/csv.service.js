function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(rows, columns) {
  const header = columns.map(c => escapeCsv(c.label)).join(',');
  const body = rows.map(row => columns.map(c => escapeCsv(row[c.key])).join(',')).join('\n');
  return [header, body].filter(Boolean).join('\n');
}
