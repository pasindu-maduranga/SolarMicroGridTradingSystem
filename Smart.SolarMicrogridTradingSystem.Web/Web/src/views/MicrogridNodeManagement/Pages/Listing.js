import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';
import MapViewModal from '../Components/MapViewModal';

const screenCode = 'NODES';

const StatusPill = ({ isActive }) => (
  <span
    className={
      'text-xs font-semibold px-2.5 py-1 rounded-full ' +
      (isActive ? 'bg-[#E8F0E6] text-[#2F6B45]' : 'bg-[#F4F1E8] text-[#726A58]')
    }
  >
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

export default function NodeListing() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [canAddEdit, setCanAddEdit] = useState(false);
  const [mapNode, setMapNode] = useState(null);

  useEffect(() => {
    trackPromise(getPermissions());
    trackPromise(getNodes());
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'VIEW' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
      return;
    }
    setCanAddEdit(permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode) !== undefined);
  }

  async function getNodes() {
    const result = await services.getAllNodes();
    setNodes(result || []);
  }

  const handleAdd = () => {
    navigate('/app/nodes/addEdit/' + btoa('0'));
  };

  const handleEdit = (nodeID) => {
    navigate('/app/nodes/addEdit/' + btoa(nodeID.toString()));
  };

  return (
    <Page title="Microgrid Nodes" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6DDC4]">
          <div>
            <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Microgrid Nodes</h1>
            <p className="text-sm text-[#726A58] mt-1">Manage physical microgrid nodes. Assign Grid Operators from the Grid Operator Mapping screen.</p>
          </div>
          {canAddEdit && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold hover:bg-[#265939] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Node
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] text-left text-[#726A58] text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Address</th>
                <th className="px-6 py-3 font-semibold">Capacity</th>
                <th className="px-6 py-3 font-semibold">Slots</th>
                <th className="px-6 py-3 font-semibold">Grid Operator</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[#A9A290]">No nodes have been added yet.</td>
                </tr>
              )}
              {nodes.map((node) => (
                <tr key={node.nodeID} className="border-t border-[#F0EDE0] hover:bg-[#FAFAF8]">
                  <td className="px-6 py-3.5 font-semibold text-[#22201A]">{node.name}</td>
                  <td className="px-6 py-3.5 text-[#726A58] max-w-[280px] truncate">{node.address || '—'}</td>
                  <td className="px-6 py-3.5 text-[#726A58]">{node.capacity} kW</td>
                  <td className="px-6 py-3.5 text-[#726A58]">
                    {node.numberOfSlots > 0 ? `${node.numberOfSlots} × ${(node.capacity / node.numberOfSlots).toFixed(1)} kW` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-[#726A58]">{node.assignedGridOperatorName || <span className="text-[#A9A290]">Unassigned</span>}</td>
                  <td className="px-6 py-3.5"><StatusPill isActive={node.isActive} /></td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="View on map"
                        onClick={() => setMapNode(node)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F1E8] text-[#2F6B45]"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      </button>
                      {canAddEdit && (
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => handleEdit(node.nodeID)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F1E8] text-[#5C3D0E]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mapNode && (
        <MapViewModal
          open={!!mapNode}
          onClose={() => setMapNode(null)}
          lat={mapNode.latitude}
          lng={mapNode.longitude}
          name={mapNode.name}
          address={mapNode.address}
        />
      )}
    </Page>
  );
}
