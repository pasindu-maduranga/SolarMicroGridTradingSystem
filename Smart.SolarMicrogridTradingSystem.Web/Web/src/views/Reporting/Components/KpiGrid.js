import React from 'react';
import { formatValue } from '../utils/format';

const ACCENTS = ['#F2A93B', '#2F6B45', '#2C6E9B', '#6D4FC7', '#C0392B'];

export default function KpiGrid({ kpis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <div key={kpi.label} className="relative bg-white border border-[#E6DDC4] rounded-2xl px-5 py-4 overflow-hidden">
          <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r" style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }} />
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">{kpi.label}</div>
          <div className="font-sans text-[24px] font-bold text-[#22201A] mt-1.5 leading-tight">{formatValue(kpi.value, kpi.type)}</div>
          {kpi.hint && <div className="text-xs text-[#A9A290] mt-1">{kpi.hint}</div>}
        </div>
      ))}
    </div>
  );
}
