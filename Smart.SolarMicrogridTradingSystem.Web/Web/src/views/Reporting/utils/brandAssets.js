// Loads the brand assets the PDF/Excel exports embed: the SolarGrid logo (rasterised from
// public/logo-solar.svg, since neither jsPDF nor ExcelJS can place an SVG) and the IBM Plex
// Sans font files in public/fonts (jsPDF only ships Helvetica/Times/Courier). Each asset is
// fetched once per session and cached.

const PUBLIC_URL = process.env.PUBLIC_URL || '';

export const BRAND = {
  name: 'SolarGrid',
  tagline: 'Smart Solar Microgrid Trading System',
  green: '#2F6B45',
  greenDark: '#1D4A30',
  amber: '#F2A93B',
  ink: '#22201A',
  muted: '#726A58',
  line: '#E6DDC4',
  paper: '#F5F4EF',
  zebra: '#FAFAF6'
};

export const PDF_FONTS = [
  { file: 'IBMPlexSans-Regular.ttf', style: 'normal' },
  { file: 'IBMPlexSans-SemiBold.ttf', style: 'semibold' },
  { file: 'IBMPlexSans-Bold.ttf', style: 'bold' }
];

let logoPromise = null;
const fontPromises = {};

// Resolves to a PNG data URL, or null if the logo couldn't be rendered - exports still work
// without it rather than failing outright.
export function getLogoPng(size = 256) {
  if (!logoPromise) {
    logoPromise = renderLogo(size).catch(() => null);
  }
  return logoPromise;
}

async function renderLogo(size) {
  const response = await fetch(PUBLIC_URL + '/logo-solar.svg');
  let svg = await response.text();
  // Firefox refuses to draw an SVG onto a canvas unless it has explicit dimensions.
  svg = svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d').drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Resolves to the font file as a base64 string (what jsPDF's addFileToVFS expects), or null.
export function getFontBase64(file) {
  if (!fontPromises[file]) {
    fontPromises[file] = fetch(PUBLIC_URL + '/fonts/' + file)
      .then((r) => {
        if (!r.ok) throw new Error('Font not found: ' + file);
        return r.arrayBuffer();
      })
      .then(arrayBufferToBase64)
      .catch(() => null);
  }
  return fontPromises[file];
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return window.btoa(binary);
}

export function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
