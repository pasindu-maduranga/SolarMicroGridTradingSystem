import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { trackPromise } from 'react-promise-tracker';
import { useAlert } from 'react-alert';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';

const screenCode = 'PROSUMERAPPROVAL';

export default function ProsumerApprovals() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [canApprove, setCanApprove] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    trackPromise(getPermissions());
    trackPromise(loadData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'VIEW' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
      return;
    }
    setCanApprove(permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode) !== undefined);
  }

  async function loadData() {
    const [pendingResult, allResult] = await Promise.all([services.getPendingProsumers(), services.getAllProsumers()]);
    setPending(pendingResult || []);
    setAll(allResult || []);
  }

  async function handleApprove(nic) {
    const response = await services.approveProsumer(nic);
    alert.success(response.message);
    trackPromise(loadData());
  }

  async function handleRejectConfirm() {
    if (!rejectReason.trim()) {
      alert.error('Please provide a reason for rejection.');
      return;
    }
    const response = await services.rejectProsumer(rejectTarget.nic, rejectReason);
    alert.success(response.message);
    setRejectTarget(null);
    setRejectReason('');
    trackPromise(loadData());
  }

  const StatusPill = ({ status }) => {
    const styles =
      status === 'Approved'
        ? 'bg-[#E8F0E6] text-[#2F6B45]'
        : status === 'Rejected'
        ? 'bg-[#FBE9E7] text-[#C0392B]'
        : 'bg-[#FBF1DD] text-[#9A6A1E]';
    return <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + styles}>{status}</span>;
  };

  const rows = tab === 'pending' ? pending : all;

  return (
    <Page title="Prosumer Approvals" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6DDC4] flex-wrap gap-3">
          <div>
            <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Prosumer Approvals</h1>
            <p className="text-sm text-[#726A58] mt-1">Review and approve mobile app registrations before Prosumers can sign in.</p>
          </div>
          <div className="flex gap-2 bg-[#FAFAF8] border border-[#E6DDC4] rounded-full p-1">
            <button
              type="button"
              onClick={() => setTab('pending')}
              className={'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ' + (tab === 'pending' ? 'bg-[#2F6B45] text-white' : 'text-[#726A58]')}
            >
              Pending ({pending.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('all')}
              className={'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ' + (tab === 'all' ? 'bg-[#2F6B45] text-white' : 'text-[#726A58]')}
            >
              All Prosumers
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E6DDC4] text-left text-xs font-semibold uppercase tracking-wide text-[#726A58]">
                <th className="px-6 py-3">NIC</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                {canApprove && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#A9A290]">
                    No {tab === 'pending' ? 'pending registrations' : 'prosumers'} found.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.nic} className="border-b border-[#F0EDE0] last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-6 py-3 font-medium text-[#22201A]">{p.nic}</td>
                    <td className="px-4 py-3 text-[#403A2E]">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-[#726A58]">{p.email}</td>
                    <td className="px-4 py-3 text-[#726A58]">{p.phoneNumber}</td>
                    <td className="px-4 py-3"><StatusPill status={p.approvalStatus} /></td>
                    {canApprove && (
                      <td className="px-4 py-3">
                        {p.approvalStatus === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(p.nic)}
                              className="px-3 py-1.5 rounded-lg bg-[#2F6B45] text-white text-xs font-semibold hover:bg-[#265939] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(p)}
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#E6DDC4] text-[#C0392B] text-xs font-semibold hover:bg-[#FBE9E7] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-xs text-[#A9A290]">—</div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Transition appear show={!!rejectTarget} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setRejectTarget(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 border border-[#E6DDC4]">
                  <Dialog.Title className="font-sans text-base font-bold text-[#22201A]">
                    Reject {rejectTarget?.firstName}'s registration?
                  </Dialog.Title>
                  <p className="text-sm text-[#726A58] mt-2">Provide a reason — this will help them understand why their registration wasn't accepted.</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. NIC image unclear, please resubmit"
                    className="w-full mt-3 rounded-xl border border-[#E6DDC4] bg-[#F4F1E8] px-3.5 py-3 text-sm text-[#22201A] outline-none focus:border-[#2F6B45] focus:bg-white transition-colors"
                  />
                  <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#726A58] hover:bg-[#FAFAF8]">
                      Cancel
                    </button>
                    <button type="button" onClick={handleRejectConfirm} className="px-4 py-2 rounded-lg bg-[#C0392B] text-white text-sm font-semibold hover:bg-[#a3301f] transition-colors">
                      Reject Registration
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Page>
  );
}
