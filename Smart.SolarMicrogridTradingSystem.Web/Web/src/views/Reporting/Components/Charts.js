import React from 'react';
import { Bar, Line, Doughnut, HorizontalBar } from 'react-chartjs-2';

// Thin wrappers over react-chartjs-2 (Chart.js 2) styled to match the dashboard palette.

export const COLORS = {
  green: '#2F6B45',
  greenSoft: 'rgba(47,107,69,0.12)',
  amber: '#F2A93B',
  blue: '#2C6E9B',
  grey: '#A9A290',
  red: '#C0392B',
  purple: '#6D4FC7'
};

const FONT = '"IBM Plex Sans", Roboto, sans-serif';

const baseOptions = {
  maintainAspectRatio: false,
  legend: { position: 'bottom', labels: { fontFamily: FONT, fontColor: '#403A2E', boxWidth: 12, padding: 16 } },
  tooltips: { titleFontFamily: FONT, bodyFontFamily: FONT, backgroundColor: '#22201A', xPadding: 10, yPadding: 8, cornerRadius: 6 }
};

// Chart.js 2 treats an explicit `scaleLabel: undefined` as an override of its defaults and
// then crashes reading `.display`, so the key is only added when there is a label.
const valueAxis = (stacked, label) => {
  const axis = {
    stacked,
    gridLines: { color: '#F0EDE0', zeroLineColor: '#E6DDC4', drawBorder: false },
    ticks: { beginAtZero: true, fontFamily: FONT, fontColor: '#726A58', padding: 8 }
  };
  if (label) {
    axis.scaleLabel = { display: true, labelString: label, fontFamily: FONT, fontColor: '#726A58' };
  }
  return axis;
};

const categoryAxis = (stacked) => ({
  stacked,
  gridLines: { display: false },
  ticks: { fontFamily: FONT, fontColor: '#726A58', maxRotation: 0, autoSkipPadding: 12 }
});

const axes = (stacked = false, yLabel) => ({
  xAxes: [categoryAxis(stacked)],
  yAxes: [valueAxis(stacked, yLabel)]
});

export function ChartCard({ title, subtitle, children, height = 280 }) {
  return (
    <div className="bg-white border border-[#E6DDC4] rounded-2xl p-5 flex flex-col">
      <div className="mb-3">
        <div className="text-[15px] font-bold text-[#22201A]">{title}</div>
        {subtitle && <div className="text-xs text-[#726A58] mt-0.5">{subtitle}</div>}
      </div>
      <div style={{ height }} className="relative">{children}</div>
    </div>
  );
}

export function ChartRow({ children }) {
  return <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">{children}</div>;
}

export function EmptyChart() {
  return <div className="absolute inset-0 flex items-center justify-center text-sm text-[#A9A290]">No data for this period</div>;
}

export function BarChart({ labels, datasets, stacked = false, yLabel }) {
  if (!labels.length) return <EmptyChart />;
  return (
    <Bar
      data={{ labels, datasets: datasets.map((d) => ({ maxBarThickness: 34, ...d })) }}
      options={{ ...baseOptions, cornerRadius: 4, legend: { ...baseOptions.legend, display: datasets.length > 1 }, scales: axes(stacked, yLabel) }}
    />
  );
}

export function HBarChart({ labels, datasets, yLabel }) {
  if (!labels.length) return <EmptyChart />;
  return (
    <HorizontalBar
      data={{ labels, datasets: datasets.map((d) => ({ maxBarThickness: 22, ...d })) }}
      options={{
        ...baseOptions,
        cornerRadius: 4,
        legend: { ...baseOptions.legend, display: datasets.length > 1 },
        scales: { xAxes: [valueAxis(false, yLabel)], yAxes: [categoryAxis(false)] }
      }}
    />
  );
}

export function LineChart({ labels, datasets, yLabel }) {
  if (!labels.length) return <EmptyChart />;
  return (
    <Line
      data={{
        labels,
        datasets: datasets.map((d) => ({ lineTension: 0.3, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2.5, fill: true, ...d }))
      }}
      options={{ ...baseOptions, legend: { ...baseOptions.legend, display: datasets.length > 1 }, scales: axes(false, yLabel) }}
    />
  );
}

export function DoughnutChart({ labels, values, colors }) {
  if (!values.some((v) => v > 0)) return <EmptyChart />;
  return (
    <Doughnut
      data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#FFFFFF', borderWidth: 3 }] }}
      options={{ ...baseOptions, cutoutPercentage: 66, legend: { ...baseOptions.legend, position: 'right' } }}
    />
  );
}

// Weekday x hour grid of booking counts (Slot Utilization).
export function Heatmap({ grid }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(1, ...grid.flat());
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="text-[10px] font-semibold text-[#A9A290] w-7">{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, d) => (
            <tr key={d}>
              <td className="text-[11px] font-semibold text-[#726A58] pr-2">{days[d]}</td>
              {row.map((count, h) => (
                <td
                  key={h}
                  title={`${days[d]} ${String(h).padStart(2, '0')}:00 — ${count} booking${count === 1 ? '' : 's'}`}
                  className="w-7 h-7 rounded text-[10px] text-center font-semibold"
                  style={{
                    backgroundColor: count === 0 ? '#F4F1E8' : `rgba(47,107,69,${0.18 + (count / max) * 0.82})`,
                    color: count / max > 0.5 ? '#FFFFFF' : '#1D4A30'
                  }}
                >
                  {count || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
