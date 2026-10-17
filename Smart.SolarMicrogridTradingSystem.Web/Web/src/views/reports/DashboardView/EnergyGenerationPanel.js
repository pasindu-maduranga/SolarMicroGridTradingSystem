import React from 'react';
import { Line } from 'react-chartjs-2';

const FONT = '"IBM Plex Sans", Roboto, sans-serif';
const numberFmt = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 });

// Daily solar energy delivered by Prosumers and verified at the hubs (completed reservations).
const pad = (n) => String(n).padStart(2, '0');

const EnergyGenerationPanel = ({ energy, updatedAt }) => {
  const series = energy ? energy.series : [];
  const hasData = series.some((d) => d.energyKwh > 0);

  return (
    <div className="flex-1 bg-white border border-[#E6DDC4] rounded-2xl p-[22px] flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2F6B45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 15l4-5 3 3 5-7" />
          </svg>
          <div>
            <div className="text-[15px] font-bold text-[#22201A]">Energy Generation</div>
            <div className="text-xs text-[#726A58]">
              Solar energy delivered to the hubs · last {energy ? energy.days : 14} days
            </div>
            {updatedAt && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[#2F6B45]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B45] inline-block animate-pulse" />
                Live · updated {pad(updatedAt.getHours())}:{pad(updatedAt.getMinutes())}
              </div>
            )}
          </div>
        </div>
        {energy && (
          <div className="flex gap-5">
            <Stat label="Today" value={numberFmt.format(energy.todayKwh) + ' kWh'} />
            <Stat label={`${energy.days}-day total`} value={numberFmt.format(energy.totalKwh) + ' kWh'} />
            <Stat label="Deliveries" value={energy.trades} />
          </div>
        )}
      </div>

      {energy === null ? (
        <div className="flex-1 min-h-[220px] rounded-xl bg-[#FBFAF6] animate-pulse" />
      ) : hasData ? (
        <div className="relative h-[230px]">
          <Line
            data={{
              labels: series.map((d) => d.label),
              datasets: [
                {
                  label: 'Energy delivered (kWh)',
                  data: series.map((d) => d.energyKwh),
                  borderColor: '#2F6B45',
                  backgroundColor: 'rgba(47,107,69,0.12)',
                  pointBackgroundColor: '#F2A93B',
                  pointBorderColor: '#FFFFFF',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  borderWidth: 2.5,
                  lineTension: 0.3,
                  fill: true
                }
              ]
            }}
            options={{
              maintainAspectRatio: false,
              legend: { display: false },
              tooltips: {
                titleFontFamily: FONT,
                bodyFontFamily: FONT,
                backgroundColor: '#22201A',
                xPadding: 10,
                yPadding: 8,
                cornerRadius: 6,
                callbacks: {
                  label: (item) => {
                    const day = series[item.index];
                    return ` ${numberFmt.format(day.energyKwh)} kWh · ${day.trades} deliver${day.trades === 1 ? 'y' : 'ies'}`;
                  }
                }
              },
              scales: {
                xAxes: [{ gridLines: { display: false }, ticks: { fontFamily: FONT, fontColor: '#726A58', maxRotation: 0, autoSkipPadding: 14 } }],
                yAxes: [
                  {
                    gridLines: { color: '#F0EDE0', zeroLineColor: '#E6DDC4', drawBorder: false },
                    ticks: { beginAtZero: true, fontFamily: FONT, fontColor: '#726A58', padding: 8, callback: (v) => v + ' kWh' }
                  }
                ]
              }
            }}
          />
        </div>
      ) : (
        <div className="flex-1 rounded-xl bg-[#FBFAF6] border border-dashed border-[#E6DDC4] flex flex-col items-center justify-center gap-1.5 text-center p-6 min-h-[180px]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A9A290" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 15l4-5 3 3 5-7" />
          </svg>
          <div className="text-[13.5px] font-semibold text-[#726A58]">No energy delivered in the last {energy.days} days</div>
          <div className="text-xs text-[#A9A290] max-w-[320px]">Deliveries appear here once a Grid Operator verifies a reservation at a hub.</div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="text-right">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#A9A290]">{label}</div>
    <div className="text-[15px] font-bold text-[#22201A]">{value}</div>
  </div>
);

export default EnergyGenerationPanel;
