import React, { useState } from 'react';

const SlotBattery = ({ slotNumber, capacity, remainingCapacity, isAvailable, unitPricePerKwh, canEditPrice, onSavePrice }) => {
  // The fill shows how much of today's shared capacity has actually been used (verified
  // deliveries), not a plain reserved/available switch - a slot fills gradually as multiple
  // Prosumers deliver into it, rather than jumping straight to 100% on a single booking.
  const remaining = remainingCapacity ?? (isAvailable ? capacity : 0);
  const usedPercent = capacity > 0 ? Math.min(100, Math.max(0, ((capacity - remaining) / capacity) * 100)) : 0;
  const isFull = remaining <= 0;
  const fillColor = isFull ? '#E8A53A' : usedPercent > 0 ? '#D9A441' : '#2F6B45';
  const label = isFull ? 'Full today' : `${remaining.toFixed(1)} kW left`;
  const labelColor = isFull ? 'text-[#B7791F]' : 'text-[#2F6B45]';

  const [editing, setEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState(unitPricePerKwh ?? 0);

  const startEdit = () => {
    setDraftPrice(unitPricePerKwh ?? 0);
    setEditing(true);
  };

  const save = () => {
    setEditing(false);
    if (onSavePrice) onSavePrice(Number(draftPrice) || 0);
  };

  return (
    <div className="flex flex-col items-center gap-2 bg-white border border-[#E6DDC4] rounded-2xl p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-[#726A58]">Slot {slotNumber}</div>

      {/* Battery body, drawn horizontally: outline + nub + fill */}
      <div className="flex items-center gap-1 my-1">
        <div className="relative w-20 h-10 border-2 border-[#726A58] rounded-md overflow-hidden bg-[#FAFAF8]">
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-500"
            style={{ width: `${usedPercent}%`, backgroundColor: fillColor }}
          />
        </div>
        <div className="w-1.5 h-4 bg-[#726A58] rounded-r-sm" />
      </div>

      <div className={`text-xs font-bold ${labelColor}`}>{label}</div>
      <div className="text-[13px] font-semibold text-[#22201A]">{remaining.toFixed(1)} / {capacity.toFixed(1)} kW</div>

      {unitPricePerKwh != null && (
        editing ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="number"
              step="0.01"
              autoFocus
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              className="w-16 border border-[#E6DDC4] rounded px-1.5 py-1 text-xs outline-none focus:border-[#2F6B45]"
            />
            <button type="button" onClick={save} className="text-[#2F6B45] text-xs font-bold px-1">✓</button>
            <button type="button" onClick={() => setEditing(false)} className="text-[#A9A290] text-xs px-1">✕</button>
          </div>
        ) : (
          <div
            className={`text-[11.5px] font-semibold text-[#726A58] mt-0.5 ${canEditPrice ? 'cursor-pointer hover:text-[#2F6B45] hover:underline' : ''}`}
            onClick={canEditPrice ? startEdit : undefined}
            title={canEditPrice ? 'Click to edit price' : undefined}
          >
            Rs. {unitPricePerKwh.toFixed(2)}/kWh{canEditPrice ? ' ✎' : ''}
          </div>
        )
      )}
    </div>
  );
};

export default SlotBattery;
