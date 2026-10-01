import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import { useAlert } from 'react-alert';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';
import SlotBattery from '../Components/SlotBattery';
import useAutoRefresh from '../Components/useAutoRefresh';

const screenCode = 'NODESLOTS';

export default function SlotsDetail() {
  const navigate = useNavigate();
  const alert = useAlert();
  const { nodeID } = useParams();
  const decrypted = atob(nodeID.toString());
  const [node, setNode] = useState(null);
  const [canEditPrice, setCanEditPrice] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');

  const loadNode = useCallback(async () => {
    const data = await services.getNodeDetailsByID(decrypted);
    setNode(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decrypted]);

  useEffect(() => {
    trackPromise(getPermissions());
    trackPromise(loadNode());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'VIEW' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
    setCanEditPrice(permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode) !== undefined);
  }

  async function saveSlotPrice(slotNumber, unitPricePerKwh) {
    const response = await services.setSlotPrices(decrypted, [{ slotNumber, unitPricePerKwh }]);
    alert.success(response.message);
    trackPromise(loadNode());
  }

  async function applyBulkPrice() {
    if (bulkPrice === '' || Number(bulkPrice) < 0 || !node?.slots?.length) {
      alert.error('Enter a valid price to apply to all slots.');
      return;
    }
    const prices = node.slots.map((s) => ({ slotNumber: s.slotNumber, unitPricePerKwh: Number(bulkPrice) }));
    const response = await services.setSlotPrices(decrypted, prices);
    alert.success(response.message);
    setBulkPrice('');
    trackPromise(loadNode());
  }

  const secondsLeft = useAutoRefresh(loadNode, 10);

  if (!node) {
    return (
      <Page title="Node Slots" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
        <LoadingComponent />
      </Page>
    );
  }

  return (
    <Page title={node.name + ' — Slots'} className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <button
        type="button"
        onClick={() => navigate('/app/nodes/slots')}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#5C3D0E] mb-4 hover:underline"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        All nodes
      </button>

      <div className="bg-white border border-[#E6DDC4] rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">{node.name}</h1>
            <p className="text-sm text-[#726A58] mt-1">
              {node.availableSlotsCount ?? 0} / {node.numberOfSlots ?? 0} slots available &middot; {(node.availableCapacity ?? 0).toFixed(0)} / {node.capacity} kW free
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#726A58] bg-[#FAFAF8] border border-[#E6DDC4] rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B45] animate-pulse" />
            Refreshing in {secondsLeft}s
          </div>
        </div>
      </div>

      {canEditPrice && (
        <div className="bg-white border border-[#E6DDC4] rounded-2xl p-5 mb-5 flex items-center gap-3 flex-wrap">
          <label className="text-xs font-bold uppercase tracking-wide text-[#726A58]">Set price for all slots (Rs/kWh)</label>
          <input
            type="number"
            step="0.01"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            placeholder="e.g. 45.00"
            className="w-32 border border-[#E6DDC4] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F6B45]"
          />
          <button
            type="button"
            onClick={applyBulkPrice}
            className="px-4 py-2 rounded-lg bg-[#2F6B45] text-white text-xs font-semibold hover:bg-[#265939] transition-colors"
          >
            Apply to All Slots
          </button>
          <span className="text-xs text-[#A9A290]">Or click a single slot's price below to edit it individually.</span>
        </div>
      )}

      {(!node.slots || node.slots.length === 0) ? (
        <div className="bg-white border border-[#E6DDC4] rounded-2xl p-10 text-center text-[#A9A290]">This node has no slots configured.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {node.slots.map((slot) => (
            <SlotBattery
              key={slot.slotNumber}
              slotNumber={slot.slotNumber}
              capacity={slot.capacity}
              remainingCapacity={slot.remainingCapacity}
              isAvailable={slot.isAvailable}
              unitPricePerKwh={slot.unitPricePerKwh}
              canEditPrice={canEditPrice}
              onSavePrice={(price) => saveSlotPrice(slot.slotNumber, price)}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
