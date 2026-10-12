import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';
import useAutoRefresh from '../Components/useAutoRefresh';

const screenCode = 'NODESLOTS';

const NodeCard = ({ node, onClick }) => {
  const availableCount = node.availableSlotsCount ?? 0;
  const totalCount = node.numberOfSlots ?? 0;
  const pct = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border border-[#E6DDC4] rounded-2xl p-5 flex flex-col gap-3 hover:shadow-[0_10px_28px_-12px_rgba(23,60,38,.22)] hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="font-sans text-base font-bold text-[#22201A]">{node.name}</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F0E6] text-[#2F6B45]">
          {node.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FAFAF8] rounded-xl p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#726A58]">Total Capacity</div>
          <div className="text-lg font-bold text-[#22201A] mt-0.5">{node.capacity} kW</div>
        </div>
        <div className="bg-[#FAFAF8] rounded-xl p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#726A58]">Available</div>
          <div className="text-lg font-bold text-[#2F6B45] mt-0.5">{(node.availableCapacity ?? 0).toFixed(0)} kW</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-[#726A58] mb-1">
          <span>{availableCount} / {totalCount} slots available</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#F0EDE0] overflow-hidden">
          <div className="h-full bg-[#2F6B45] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#2F6B45] mt-1">
        View slots
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </button>
  );
};

export default function SlotsOverview() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);

  const loadNodes = useCallback(async () => {
    const result = await services.getAllNodes();
    setNodes(result || []);
  }, []);

  useEffect(() => {
    trackPromise(getPermissions());
    trackPromise(loadNodes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'VIEW' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  const secondsLeft = useAutoRefresh(loadNodes, 10);

  return (
    <Page title="Node Slots" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Node Slots</h1>
          <p className="text-sm text-[#726A58] mt-1">Select a node to view its individual slots.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#726A58] bg-white border border-[#E6DDC4] rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B45] animate-pulse" />
          Refreshing in {secondsLeft}s
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="bg-white border border-[#E6DDC4] rounded-2xl p-10 text-center text-[#A9A290]">No nodes have been added yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {nodes.map((node) => (
            <NodeCard key={node.nodeID} node={node} onClick={() => navigate('/app/nodes/slots/' + btoa(node.nodeID.toString()))} />
          ))}
        </div>
      )}
    </Page>
  );
}
