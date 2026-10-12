import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import { useAlert } from 'react-alert';
import { Listbox, Transition } from '@headlessui/react';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';

const screenCode = 'GRIDOPERATORMAP';

function MappingRow({ node, operators, onSave, saving }) {
  const currentValue = node.assignedGridOperatorUserId || '';
  const [pendingValue, setPendingValue] = useState(currentValue);

  useEffect(() => {
    setPendingValue(currentValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  const options = [...operators];
  if (node.assignedGridOperatorUserId && !options.find((o) => o.userID === node.assignedGridOperatorUserId)) {
    options.unshift({ userID: node.assignedGridOperatorUserId, name: node.assignedGridOperatorName, userName: '' });
  }

  const isDirty = pendingValue !== currentValue;

  return (
    <tr className="border-t border-[#F0EDE0] hover:bg-[#FAFAF8]">
      <td className="px-6 py-3.5 font-semibold text-[#22201A]">{node.name}</td>
      <td className="px-6 py-3.5 text-[#726A58] max-w-[320px] truncate">{node.address || '—'}</td>
      <td className="px-6 py-3.5">
        <Listbox value={pendingValue} onChange={setPendingValue} disabled={saving}>
          <div className="relative w-64">
            <Listbox.Button className="w-full flex items-center justify-between border border-[#E6DDC4] rounded-lg px-3 py-2 text-sm text-left bg-white disabled:opacity-60">
              <span className={pendingValue ? 'text-[#22201A]' : 'text-[#A9A290]'}>
                {options.find((o) => o.userID === pendingValue)?.name || 'Unassigned'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#726A58" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </Listbox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-75" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-[#E6DDC4] rounded-lg shadow-lg max-h-56 overflow-auto py-1">
                <Listbox.Option value="" className={({ active }) => `px-3 py-2 text-sm cursor-pointer ${active ? 'bg-[#F4F1E8]' : ''} text-[#A9A290]`}>
                  Unassigned
                </Listbox.Option>
                {options.map((op) => (
                  <Listbox.Option key={op.userID} value={op.userID} className={({ active }) => `px-3 py-2 text-sm cursor-pointer ${active ? 'bg-[#F4F1E8]' : ''} text-[#22201A]`}>
                    {op.name}{op.userName ? <span className="text-[#A9A290]"> ({op.userName})</span> : null}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </td>
      <td className="px-6 py-3.5">
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={() => onSave(node.nodeID, pendingValue)}
          className="px-4 py-2 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  );
}

export default function GridOperatorMapping() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [nodes, setNodes] = useState([]);
  const [availableOperators, setAvailableOperators] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    trackPromise(getPermissions());
    trackPromise(loadData());
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  async function loadData() {
    const [allNodes, unassigned] = await Promise.all([
      services.getAllNodes(),
      services.getAvailableGridOperators(null)
    ]);
    setNodes(allNodes || []);
    setAvailableOperators(unassigned || []);
  }

  async function handleSave(nodeID, operatorUserId) {
    setSavingId(nodeID);
    const response = await services.assignGridOperator(nodeID, operatorUserId || null);
    if (response.statusCode === 'Success') {
      alert.success(response.message);
      trackPromise(loadData());
    } else {
      alert.error(response.message);
    }
    setSavingId(null);
  }

  return (
    <Page title="Grid Operator ↔ Node Mapping" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E6DDC4]">
          <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Grid Operator ↔ Node Mapping</h1>
          <p className="text-sm text-[#726A58] mt-1">Assign or reassign a Grid Operator to each node, then click Save. A Grid Operator can only be attached to one node at a time.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] text-left text-[#726A58] text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-semibold">Node</th>
                <th className="px-6 py-3 font-semibold">Address</th>
                <th className="px-6 py-3 font-semibold">Grid Operator</th>
                <th className="px-6 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[#A9A290]">No nodes have been added yet.</td>
                </tr>
              )}
              {nodes.map((node) => (
                <MappingRow
                  key={node.nodeID}
                  node={node}
                  operators={availableOperators}
                  onSave={handleSave}
                  saving={savingId === node.nodeID}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}
