import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
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

export default function ReservationsListing() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);

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
    }
  }

  async function loadData() {
    const result = await services.getAllReservations();
    setReservations(result || []);
  }

  return (
    <Page title="Reservations" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6DDC4]">
          <div>
            <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Reservations</h1>
            <p className="text-sm text-[#726A58] mt-1">Slots reserved by Prosumers across all microgrid nodes, via the mobile app.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E6DDC4] text-left text-xs font-semibold uppercase tracking-wide text-[#726A58]">
                <th className="px-6 py-3">Node</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Prosumer</th>
                <th className="px-4 py-3">NIC</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#A9A290]">No reservations yet.</td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.reservationId} className="border-b border-[#F0EDE0] last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-6 py-3 font-medium text-[#22201A]">{r.nodeName}</td>
                    <td className="px-4 py-3 text-[#403A2E]">#{r.slotNumber} &middot; {r.slotCapacity} kW</td>
                    <td className="px-4 py-3 text-[#403A2E]">{r.prosumerName}</td>
                    <td className="px-4 py-3 text-[#726A58]">{r.prosumerNic}</td>
                    <td className="px-4 py-3 text-[#726A58]">{new Date(r.reservedDate).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
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
