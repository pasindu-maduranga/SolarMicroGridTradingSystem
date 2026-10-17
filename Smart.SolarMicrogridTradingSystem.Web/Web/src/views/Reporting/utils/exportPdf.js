import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND, PDF_FONTS, getLogoPng, getFontBase64, hexToRgb } from './brandAssets';
import { formatValue, formatDateTime, isNumeric, slugify } from './format';

// Branded A4 PDF for any report. `report` shape (same object the Excel export takes):
// {
//   title, subtitle,
//   meta: [{ label, value }],                 // filter / context chips
//   kpis: [{ label, value, type }],           // headline figures
//   sections: [{ title, columns, rows, totals? }]
// }

const MARGIN = 14;
const FONT = 'IBMPlexSans';

export async function exportReportPdf(report) {
  const widest = Math.max(...report.sections.map((s) => s.columns.length));
  const orientation = widest > 6 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const font = await registerFonts(doc);
  const logo = await getLogoPng(256);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  const setFont = (style, size, color = BRAND.ink) => {
    doc.setFont(font.family, font.style(style));
    doc.setFontSize(size);
    doc.setTextColor(...hexToRgb(color));
  };

  // ---- Page 1 header ----
  let y = drawBrandHeader(doc, { logo, setFont, pageWidth, generatedOn: new Date() });

  // ---- Title ----
  y += 9;
  setFont('bold', 19);
  doc.text(report.title, MARGIN, y);
  if (report.subtitle) {
    y += 6;
    setFont('normal', 9.5, BRAND.muted);
    const lines = doc.splitTextToSize(report.subtitle, contentWidth);
    doc.text(lines, MARGIN, y);
    y += (lines.length - 1) * 4.2;
  }

  // ---- Filter chips ----
  if (report.meta && report.meta.length) {
    y += 6;
    y = drawMetaChips(doc, report.meta, { y, setFont, contentWidth });
  }

  // ---- KPI cards ----
  if (report.kpis && report.kpis.length) {
    y += 5;
    y = drawKpis(doc, report.kpis, { y, setFont, contentWidth });
  }

  // ---- Tables ----
  report.sections.forEach((section) => {
    y += 8;
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 30;
    }
    // Accent bar + section heading
    doc.setFillColor(...hexToRgb(BRAND.amber));
    doc.roundedRect(MARGIN, y - 3.6, 1.2, 4.6, 0.4, 0.4, 'F');
    setFont('semibold', 11.5);
    doc.text(section.title, MARGIN + 3.5, y);
    setFont('normal', 8, BRAND.muted);
    const countText = section.rows.length + (section.rows.length === 1 ? ' record' : ' records');
    doc.text(countText, pageWidth - MARGIN, y, { align: 'right' });

    drawTable(doc, section, { startY: y + 3, font });
    y = doc.lastAutoTable.finalY;
  });

  // ---- Running header (page 2+) and footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (i > 1) {
      drawRunningHeader(doc, { logo, setFont, pageWidth, title: report.title });
    }
    drawFooter(doc, { setFont, pageWidth, pageHeight, page: i, pages });
  }

  doc.save(slugify(report.title) + '-' + new Date().toISOString().slice(0, 10) + '.pdf');
}

async function registerFonts(doc) {
  const files = await Promise.all(PDF_FONTS.map((f) => getFontBase64(f.file)));
  if (files.every(Boolean)) {
    PDF_FONTS.forEach((f, i) => {
      doc.addFileToVFS(f.file, files[i]);
      doc.addFont(f.file, FONT, f.style);
    });
    return { family: FONT, style: (s) => s };
  }
  // Fallback: the built-in Helvetica has no semibold, so use bold in its place.
  return { family: 'helvetica', style: (s) => (s === 'semibold' ? 'bold' : s) };
}

function drawBrandHeader(doc, { logo, setFont, pageWidth, generatedOn }) {
  const top = 12;
  const logoSize = 15;
  let textX = MARGIN;
  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN, top, logoSize, logoSize);
    textX = MARGIN + logoSize + 3.5;
  }
  setFont('bold', 17, BRAND.greenDark);
  doc.text(BRAND.name, textX, top + 7);
  setFont('normal', 8.5, BRAND.muted);
  doc.text(BRAND.tagline, textX, top + 12);

  setFont('semibold', 7.5, BRAND.amber);
  doc.text('ANALYTICS REPORT', pageWidth - MARGIN, top + 6, { align: 'right', charSpace: 0.6 });
  setFont('normal', 8, BRAND.muted);
  doc.text('Generated ' + formatDateTime(generatedOn), pageWidth - MARGIN, top + 11.5, { align: 'right' });

  const ruleY = top + logoSize + 4;
  doc.setDrawColor(...hexToRgb(BRAND.green));
  doc.setLineWidth(0.8);
  doc.line(MARGIN, ruleY, pageWidth - MARGIN, ruleY);
  doc.setDrawColor(...hexToRgb(BRAND.amber));
  doc.setLineWidth(0.8);
  doc.line(MARGIN, ruleY, MARGIN + 28, ruleY);
  return ruleY;
}

function drawRunningHeader(doc, { logo, setFont, pageWidth, title }) {
  const top = 9;
  let textX = MARGIN;
  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN, top, 8, 8);
    textX = MARGIN + 10;
  }
  setFont('bold', 10, BRAND.greenDark);
  doc.text(BRAND.name, textX, top + 5.5);
  setFont('normal', 8.5, BRAND.muted);
  doc.text(title, pageWidth - MARGIN, top + 5.5, { align: 'right' });
  doc.setDrawColor(...hexToRgb(BRAND.line));
  doc.setLineWidth(0.3);
  doc.line(MARGIN, top + 10, pageWidth - MARGIN, top + 10);
}

function drawFooter(doc, { setFont, pageWidth, pageHeight, page, pages }) {
  const y = pageHeight - 9;
  doc.setDrawColor(...hexToRgb(BRAND.line));
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y - 4.5, pageWidth - MARGIN, y - 4.5);
  setFont('normal', 7.5, BRAND.muted);
  doc.text(BRAND.name + '  ·  ' + BRAND.tagline + '  ·  Confidential', MARGIN, y);
  setFont('semibold', 7.5, BRAND.muted);
  doc.text('Page ' + page + ' of ' + pages, pageWidth - MARGIN, y, { align: 'right' });
}

function drawMetaChips(doc, meta, { y, setFont, contentWidth }) {
  const height = 7.5;
  const gap = 2.5;
  const padX = 3;
  let x = MARGIN;
  let rowY = y;
  meta.forEach((item) => {
    setFont('semibold', 7.5, BRAND.muted);
    const labelText = item.label.toUpperCase() + '  ';
    const labelWidth = doc.getTextWidth(labelText);
    setFont('semibold', 8.5, BRAND.ink);
    const valueWidth = doc.getTextWidth(String(item.value));
    const width = padX * 2 + labelWidth + valueWidth;
    if (x + width > MARGIN + contentWidth) {
      x = MARGIN;
      rowY += height + gap;
    }
    doc.setFillColor(...hexToRgb(BRAND.paper));
    doc.setDrawColor(...hexToRgb(BRAND.line));
    doc.setLineWidth(0.25);
    doc.roundedRect(x, rowY, width, height, 1.8, 1.8, 'FD');
    setFont('semibold', 7.5, BRAND.muted);
    doc.text(labelText, x + padX, rowY + 4.9);
    setFont('semibold', 8.5, BRAND.ink);
    doc.text(String(item.value), x + padX + labelWidth, rowY + 4.9);
    x += width + gap;
  });
  return rowY + height;
}

function drawKpis(doc, kpis, { y, setFont, contentWidth }) {
  const perRow = Math.min(kpis.length, 5);
  const gap = 3.5;
  const width = (contentWidth - gap * (perRow - 1)) / perRow;
  const height = 19;
  kpis.forEach((kpi, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = MARGIN + col * (width + gap);
    const top = y + row * (height + gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...hexToRgb(BRAND.line));
    doc.setLineWidth(0.3);
    doc.roundedRect(x, top, width, height, 2.2, 2.2, 'FD');
    doc.setFillColor(...hexToRgb(i === 0 ? BRAND.amber : BRAND.green));
    doc.roundedRect(x, top + 3.5, 1.1, height - 7, 0.5, 0.5, 'F');

    setFont('semibold', 7, BRAND.muted);
    const label = kpi.label.toUpperCase();
    fitText(doc, label, width - 8 - label.length * 0.25);
    doc.text(label, x + 4.5, top + 6.8, { charSpace: 0.25 });
    setFont('bold', 13.5, BRAND.ink);
    const value = formatValue(kpi.value, kpi.type);
    doc.text(fitText(doc, value, width - 8), x + 4.5, top + 14.6);
  });
  const rows = Math.ceil(kpis.length / perRow);
  return y + rows * height + (rows - 1) * gap;
}

// Shrinks long KPI labels/values (e.g. big rupee totals) so they never overflow their card.
function fitText(doc, text, maxWidth) {
  let size = doc.getFontSize();
  const min = Math.min(size, 5.5);
  while (doc.getTextWidth(text) > maxWidth && size > min) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return text;
}

function drawTable(doc, section, { startY, font }) {
  const head = [section.columns.map((c) => c.label)];
  const body = section.rows.length
    ? section.rows.map((row) => section.columns.map((c) => formatValue(row[c.key], c.type)))
    : [[{ content: 'No records for the selected filters.', colSpan: section.columns.length, styles: { halign: 'center', textColor: hexToRgb(BRAND.muted), fontStyle: font.style('normal') } }]];
  const foot = section.totals && section.rows.length
    ? [section.columns.map((c, i) => (i === 0 ? 'Total' : section.totals[c.key] !== undefined ? formatValue(section.totals[c.key], c.type) : ''))]
    : undefined;

  const columnStyles = {};
  section.columns.forEach((c, i) => {
    columnStyles[i] = { halign: isNumeric(c.type) ? 'right' : 'left' };
    if (c.pdfWidth) columnStyles[i].cellWidth = c.pdfWidth;
  });

  autoTable(doc, {
    startY,
    head,
    body,
    foot,
    showFoot: 'lastPage',
    margin: { left: MARGIN, right: MARGIN, top: 24, bottom: 18 },
    theme: 'grid',
    styles: {
      font: font.family,
      fontStyle: font.style('normal'),
      fontSize: 8.4,
      textColor: hexToRgb(BRAND.ink),
      cellPadding: { top: 2.4, bottom: 2.4, left: 2.6, right: 2.6 },
      lineColor: hexToRgb(BRAND.line),
      lineWidth: 0.2,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: hexToRgb(BRAND.green),
      textColor: [255, 255, 255],
      fontStyle: font.style('semibold'),
      fontSize: 8.2,
      lineColor: hexToRgb(BRAND.green)
    },
    footStyles: {
      fillColor: hexToRgb(BRAND.paper),
      textColor: hexToRgb(BRAND.greenDark),
      fontStyle: font.style('bold'),
      lineColor: hexToRgb(BRAND.line)
    },
    alternateRowStyles: { fillColor: hexToRgb(BRAND.zebra) },
    columnStyles,
    didParseCell: (data) => {
      // Keep header/footer alignment in line with the column's data alignment.
      if ((data.section === 'head' || data.section === 'foot') && columnStyles[data.column.index]) {
        data.cell.styles.halign = columnStyles[data.column.index].halign;
      }
      // Colour status values so they scan at a glance.
      const column = section.columns[data.column.index];
      if (data.section === 'body' && column && column.type === 'status') {
        const color = STATUS_COLORS[data.cell.raw];
        if (color) {
          data.cell.styles.textColor = hexToRgb(color);
          data.cell.styles.fontStyle = font.style('semibold');
        }
      }
    }
  });
}

const STATUS_COLORS = {
  Completed: '#2F6B45',
  Approved: '#2F6B45',
  Active: '#2C6E9B',
  Pending: '#B7791F',
  Overdue: '#C0392B',
  Cancelled: '#8A8170',
  Rejected: '#C0392B'
};
