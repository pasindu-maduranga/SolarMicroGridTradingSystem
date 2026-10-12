import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import { useAlert } from 'react-alert';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';

const screenCode = 'RESERVATIONS';

const StatusPill = ({ status }) => {
  const styles =
    status === 'Completed'
      ? 'bg-[#E8F0E6] text-[#2F6B45]'
      : status === 'Cancelled'
      ? 'bg-[#F4F1E8] text-[#726A58]'
      : 'bg-[#E6F0F7] text-[#2C6E9B]';
  return <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + styles}>{status}</span>;
};

// Mirrors the API's 12-hour notice rule so the buttons look disabled instead of just failing
// after a click - the server still enforces this regardless of what the button shows.
function canModify(reservation) {
  const scheduled = new Date(reservation.scheduledDate).getTime();
  return scheduled - Date.now() >= 12 * 60 * 60 * 1000;
}

export default function ReservationsListing() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [reservations, setReservations] = useState([]);
  const [canManage, setCanManage] = useState(false);

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
    setCanManage(permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode) !== undefined);
  }

  async function loadData() {
    const result = await services.getAllReservations();
    setReservations(result || []);
  }

  const handleAdd = () => navigate('/app/reservations/addEdit/new');
  const handleReschedule = (reservationId) => navigate('/app/reservations/addEdit/' + reservationId);

  async function handleCancelReservation(reservation) {
    if (!window.confirm(`Cancel the reservation for ${reservation.prosumerName} at ${reservation.nodeName}?`)) {
      return;
    }
    const response = await services.cancelReservation(reservation);
    if (response.statusCode === 'Success') {
      alert.success(response.message);
      trackPromise(loadData());
    } else {
      alert.error(response.message);
    }
  }

  return (
    <Page title="Reservations" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6DDC4] flex-wrap gap-3">
          <div>
            <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Reservations</h1>
            <p className="text-sm text-[#726A58] mt-1">Energy slot reservations across all microgrid nodes.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold hover:bg-[#265939] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New Reservation
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E6DDC4] text-left text-xs font-semibold uppercase tracking-wide text-[#726A58]">
                <th className="px-6 py-3">Node</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Prosumer</th>
                <th className="px-4 py-3">NIC</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-6 py-10 text-center text-[#A9A290]">No reservations yet.</td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.reservationId} className="border-b border-[#F0EDE0] last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-6 py-3 font-medium text-[#22201A]">{r.nodeName}</td>
                    <td className="px-4 py-3 text-[#403A2E]">#{r.slotNumber} &middot; {r.slotCapacity} kW</td>
                    <td className="px-4 py-3 text-[#403A2E]">{r.prosumerName}</td>
                    <td className="px-4 py-3 text-[#726A58]">{r.prosumerNic}</td>
                    <td className="px-4 py-3 text-[#726A58]">{new Date(r.scheduledDate).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    {canManage && (
                      <td className="px-4 py-3">
                        {r.status === 'Active' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleReschedule(r.reservationId)}
                              disabled={!canModify(r)}
                              title={!canModify(r) ? "Less than 12 hours to go - can no longer be changed." : undefined}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E6DDC4] text-[#2F6B45] hover:bg-[#EAF3EC] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelReservation(r)}
                              disabled={!canModify(r)}
                              title={!canModify(r) ? "Less than 12 hours to go - can no longer be changed." : undefined}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E6DDC4] text-[#C0392B] hover:bg-[#FBE9E7] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Cancel
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
    </Page>
  );
}
