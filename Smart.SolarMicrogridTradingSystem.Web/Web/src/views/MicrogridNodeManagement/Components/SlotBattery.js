import React from 'react';

const SlotBattery = ({ slotNumber, capacity, isAvailable }) => {
  const fillPercent = isAvailable ? 0 : 100;
  const fillColor = isAvailable ? '#2F6B45' : '#E8A53A';
  const label = isAvailable ? 'Available' : 'Reserved';
  const labelColor = isAvailable ? 'text-[#2F6B45]' : 'text-[#B7791F]';

  return (
    <div className="flex flex-col items-center gap-2 bg-white border border-[#E6DDC4] rounded-2xl p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-[#726A58]">Slot {slotNumber}</div>

      {/* Battery body, drawn horizontally: outline + nub + fill */}
      <div className="flex items-center gap-1 my-1">
        <div className="relative w-20 h-10 border-2 border-[#726A58] rounded-md overflow-hidden bg-[#FAFAF8]">
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-500"
            style={{ width: `${fillPercent}%`, backgroundColor: fillColor }}
          />
        </div>
        <div className="w-1.5 h-4 bg-[#726A58] rounded-r-sm" />
      </div>

      <div className={`text-xs font-bold ${labelColor}`}>{label}</div>
      <div className="text-[13px] font-semibold text-[#22201A]">{capacity.toFixed(1)} kW</div>
    </div>
  );
};

export default SlotBattery;
