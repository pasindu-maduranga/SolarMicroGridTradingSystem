import React from 'react';

const DashboardStatCard = ({ icon, iconBg = '#E8F0E6', value, label, sublabel, live = false }) => {
  return (
    <div className="bg-white border border-[#E6DDC4] rounded-2xl p-[18px] flex flex-col gap-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(23,60,38,.22)]">
      <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className={'font-sans text-[26px] font-bold ' + (value === '—' ? 'text-[#A9A290]' : 'text-[#22201A]')}>{value}</div>
      <div className="text-[13px] font-semibold text-[#22201A]">{label}</div>
      {live ? (
        <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#2F6B45]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B45] inline-block" /> Live
        </div>
      ) : (
        <div className="text-[11px] font-semibold text-[#726A58] bg-[#F4F1E8] px-2 py-1 rounded-full w-fit">{sublabel}</div>
      )}
    </div>
  );
};

export default DashboardStatCard;
