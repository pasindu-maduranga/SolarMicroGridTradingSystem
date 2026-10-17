import ExcelJS from 'exceljs';
import { BRAND, getLogoPng, downloadBlob } from './brandAssets';
import { formatDateTime, formatValue, isNumeric, slugify } from './format';

// Branded .xlsx for any report - takes the same `report` object as exportReportPdf.
// Sheet 1 "Summary" carries the logo, title, filters and headline figures; every table
// section gets its own sheet with real (sortable, summable) numbers and Excel formats.

const FONT = 'Calibri';
const argb = (hex) => 'FF' + hex.replace('#', '').toUpperCase();

const NUM_FORMATS = {
  number: '#,##0.00',
  integer: '#,##0',
  kwh: '#,##0.00 "kWh"',
  currency: '"Rs." #,##0.00',
  percent: '0.0"%"',
  date: 'dd mmm yyyy',
  datetime: 'dd mmm yyyy hh:mm'
};

const thin = { style: 'thin', color: { argb: argb(BRAND.line) } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

export async function exportReportExcel(report) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();
  workbook.title = report.title;

  const logo = await getLogoPng(256);
  const logoId = logo ? workbook.addImage({ base64: logo, extension: 'png' }) : null;
  const generatedOn = formatDateTime(new Date());

  buildSummarySheet(workbook, report, { logoId, generatedOn });
  const usedNames = new Set(['Summary']);
  report.sections.forEach((section) => {
    buildSectionSheet(workbook, report, section, { logoId, generatedOn, name: uniqueSheetName(section.title, usedNames) });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, slugify(report.title) + '-' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function buildSummarySheet(workbook, report, { logoId, generatedOn }) {
  const sheet = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  sheet.columns = [{ width: 4 }, { width: 30 }, { width: 34 }, { width: 18 }];

  let row = drawBrandBand(sheet, { logoId, title: report.title, generatedOn, lastCol: 4 });

  if (report.subtitle) {
    row += 1;
    sheet.mergeCells(row, 2, row, 4);
    const description = sheet.getCell(row, 2);
    description.value = report.subtitle;
    description.font = { name: FONT, size: 10, italic: true, color: { argb: argb(BRAND.muted) } };
    description.alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(row).height = 30;
  }

  if (report.meta && report.meta.length) {
    row += 1;
    row = sectionHeading(sheet, row, 'Report filters', 4);
    report.meta.forEach((m) => {
      const r = sheet.getRow(row++);
      r.getCell(2).value = m.label;
      r.getCell(2).font = { name: FONT, size: 10, color: { argb: argb(BRAND.muted) } };
      r.getCell(3).value = String(m.value);
      r.getCell(3).font = { name: FONT, size: 10, bold: true, color: { argb: argb(BRAND.ink) } };
      [2, 3].forEach((c) => (r.getCell(c).border = { bottom: thin }));
    });
  }

  if (report.kpis && report.kpis.length) {
    row += 1;
    row = sectionHeading(sheet, row, 'Key figures', 4);
    report.kpis.forEach((k, i) => {
      const r = sheet.getRow(row++);
      r.height = 22;
      const labelCell = r.getCell(2);
      labelCell.value = k.label;
      labelCell.font = { name: FONT, size: 10.5, color: { argb: argb(BRAND.muted) } };
      const valueCell = r.getCell(3);
      setTypedValue(valueCell, k.value, k.type);
      valueCell.font = { name: FONT, size: 13, bold: true, color: { argb: argb(i === 0 ? BRAND.greenDark : BRAND.ink) } };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      labelCell.alignment = { vertical: 'middle' };
      [2, 3].forEach((c) => {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(i % 2 ? '#FFFFFF' : BRAND.zebra) } };
        r.getCell(c).border = { bottom: thin };
      });
    });
  }

  row += 1;
  const note = sheet.getCell(row, 2);
  note.value = 'Detailed records are on the following sheet(s): ' + report.sections.map((s) => s.title).join(', ') + '.';
  note.font = { name: FONT, size: 9, italic: true, color: { argb: argb(BRAND.muted) } };
}

function buildSectionSheet(workbook, report, section, { logoId, generatedOn, name }) {
  const columns = section.columns;
  const sheet = workbook.addWorksheet(name, {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: columns.length > 6 ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    headerFooter: { oddFooter: '&L' + BRAND.name + ' · ' + report.title + '&RPage &P of &N' }
  });

  sheet.columns = columns.map((c) => ({ width: columnWidth(c, section.rows) }));
  const lastCol = Math.max(columns.length, 3);
  let row = drawBrandBand(sheet, { logoId, title: report.title, subtitle: section.title, generatedOn, lastCol });
  row += 1;

  // Header row
  const headerRowNumber = row;
  const header = sheet.getRow(row++);
  header.height = 24;
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.label;
    cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND.green) } };
    cell.alignment = { vertical: 'middle', horizontal: isNumeric(c.type) ? 'right' : 'left', wrapText: true };
    cell.border = { top: thin, bottom: thin, left: { style: 'thin', color: { argb: argb(BRAND.green) } }, right: { style: 'thin', color: { argb: argb(BRAND.green) } } };
  });

  // Data rows
  if (section.rows.length === 0) {
    sheet.mergeCells(row, 1, row, columns.length);
    const cell = sheet.getCell(row, 1);
    cell.value = 'No records for the selected filters.';
    cell.font = { name: FONT, size: 10, italic: true, color: { argb: argb(BRAND.muted) } };
    cell.alignment = { horizontal: 'center' };
    row++;
  }
  section.rows.forEach((data, index) => {
    const r = sheet.getRow(row++);
    r.height = 18;
    columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      setTypedValue(cell, data[c.key], c.type);
      cell.font = { name: FONT, size: 10, color: { argb: argb(statusColor(c, data[c.key]) || BRAND.ink) }, bold: !!statusColor(c, data[c.key]) };
      cell.alignment = { vertical: 'middle', horizontal: isNumeric(c.type) ? 'right' : 'left' };
      cell.border = allBorders;
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND.zebra) } };
      }
    });
  });

  // Totals row - written as SUM formulas over the numeric columns so it stays correct if
  // someone filters or edits the sheet.
  if (section.totals && section.rows.length) {
    const r = sheet.getRow(row);
    r.height = 20;
    const firstData = headerRowNumber + 1;
    const lastData = row - 1;
    columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (i === 0) {
        cell.value = 'Total';
      } else if (section.totals[c.key] !== undefined) {
        const letter = sheet.getColumn(i + 1).letter;
        const isSum = c.type !== 'percent' && !c.noSum;
        cell.value = isSum
          ? { formula: `SUBTOTAL(9,${letter}${firstData}:${letter}${lastData})`, result: section.totals[c.key] }
          : section.totals[c.key];
        if (NUM_FORMATS[c.type]) cell.numFmt = NUM_FORMATS[c.type];
      }
      cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: argb(BRAND.greenDark) } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND.paper) } };
      cell.alignment = { vertical: 'middle', horizontal: isNumeric(c.type) ? 'right' : 'left' };
      cell.border = { top: { style: 'medium', color: { argb: argb(BRAND.green) } }, bottom: thin, left: thin, right: thin };
    });
    row++;
  }

  if (section.rows.length) {
    sheet.autoFilter = { from: { row: headerRowNumber, column: 1 }, to: { row: headerRowNumber, column: columns.length } };
  }
  sheet.views = [{ state: 'frozen', ySplit: headerRowNumber, showGridLines: false }];
  sheet.pageSetup.printTitlesRow = headerRowNumber + ':' + headerRowNumber;
}

// Logo + title band across the top of a sheet. Returns the last row it used.
function drawBrandBand(sheet, { logoId, title, subtitle, generatedOn, lastCol }) {
  const textCol = logoId !== null ? 2 : 1;
  sheet.getRow(1).height = 26;
  sheet.getRow(2).height = 20;
  sheet.getRow(3).height = 16;
  sheet.getRow(4).height = 8;

  if (logoId !== null) {
    sheet.addImage(logoId, { tl: { col: 0.1, row: 0.15 }, ext: { width: 54, height: 54 }, editAs: 'oneCell' });
    if (sheet.getColumn(1).width < 9) sheet.getColumn(1).width = 9;
  }

  const brand = sheet.getCell(1, textCol);
  brand.value = BRAND.name + '  ·  ' + BRAND.tagline;
  brand.font = { name: FONT, size: 10, bold: true, color: { argb: argb(BRAND.green) } };
  brand.alignment = { vertical: 'bottom' };

  const titleCell = sheet.getCell(2, textCol);
  titleCell.value = subtitle && subtitle !== title ? title + ' — ' + subtitle : title;
  titleCell.font = { name: FONT, size: 16, bold: true, color: { argb: argb(BRAND.ink) } };

  const generated = sheet.getCell(3, textCol);
  generated.value = 'Generated ' + generatedOn;
  generated.font = { name: FONT, size: 9, color: { argb: argb(BRAND.muted) } };

  // Green rule with an amber accent under the band
  for (let c = 1; c <= lastCol; c++) {
    sheet.getCell(4, c).border = { bottom: { style: 'medium', color: { argb: argb(c === 1 ? BRAND.amber : BRAND.green) } } };
  }
  return 4;
}

function sectionHeading(sheet, row, text, lastCol) {
  const cell = sheet.getCell(row, 2);
  cell.value = text.toUpperCase();
  cell.font = { name: FONT, size: 9.5, bold: true, color: { argb: argb(BRAND.amber) } };
  for (let c = 2; c <= lastCol - 1; c++) {
    sheet.getCell(row, c).border = { bottom: { style: 'thin', color: { argb: argb(BRAND.amber) } } };
  }
  return row + 1;
}

function setTypedValue(cell, value, type) {
  if (value === null || value === undefined || value === '') {
    cell.value = '—';
    return;
  }
  if (type === 'date' || type === 'datetime') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      // ExcelJS writes dates as UTC; shift so the sheet shows the viewer's local clock.
      cell.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      cell.numFmt = NUM_FORMATS[type];
      return;
    }
  }
  if (isNumeric(type) && typeof value === 'number') {
    cell.value = value;
    cell.numFmt = NUM_FORMATS[type];
    return;
  }
  cell.value = formatValue(value, type);
}

const STATUS_HEX = {
  Completed: BRAND.green,
  Approved: BRAND.green,
  Active: '#2C6E9B',
  Pending: '#B7791F',
  Overdue: '#C0392B',
  Cancelled: '#8A8170',
  Rejected: '#C0392B'
};

function statusColor(column, value) {
  return column.type === 'status' ? STATUS_HEX[value] : null;
}

function columnWidth(column, rows) {
  const sample = rows.slice(0, 200).map((r) => formatValue(r[column.key], column.type).length);
  const longest = Math.max(column.label.length, ...sample, 6);
  return Math.min(Math.max(longest + 3, 10), 48);
}

function uniqueSheetName(title, used) {
  const base = title.replace(/[[\]:*?/\\]/g, ' ').slice(0, 28).trim() || 'Data';
  let name = base;
  let n = 2;
  while (used.has(name)) name = base + ' ' + n++;
  used.add(name);
  return name;
}
