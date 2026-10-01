import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import { useAlert } from 'react-alert';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';

const screenCode = 'PROSUMERPROFILE';

export default function ProsumerListing() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [prosumers, setProsumers] = useState([]);
  const [search, setSearch] = useState('');
  const [canManage, setCanManage] = useState(false);

  const handleAdd = () => navigate('/app/prosumers/addEdit');

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
    const result = await services.getAllProsumers();
    setProsumers(result || []);
  }

  // Staff can create a Prosumer account (Add Prosumer) and flip its active status here, but not
  // edit bio data (name, email, phone, address, location) - that stays self-managed from the
  // mobile app's Edit Profile screen. Re-sending the unchanged fields alongside the flipped
  // isActive flag is just satisfying the API's required-fields contract, not an edit.
  async function handleToggleActive(prosumer) {
    const response = await services.updateProsumer({ ...prosumer, isActive: !prosumer.isActive });
    if (response.statusCode === 'Success') {
      alert.success(response.message);
      trackPromise(loadData());
    } else {
      alert.error(response.message);
    }
  }

  const StatusPill = ({ isActive }) => (
    <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (isActive ? 'bg-[#E8F0E6] text-[#2F6B45]' : 'bg-[#FBE9E7] text-[#C0392B]')}>
      {isActive ? 'Active' : 'Deactivated'}
    </span>
  );

  const rows = prosumers.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nic.toLowerCase().includes(q) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <Page title="Prosumer Profiles" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6DDC4] flex-wrap gap-3">
          <div>
            <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Prosumer Profiles</h1>
            <p className="text-sm text-[#726A58] mt-1">
              View Prosumer accounts and deactivate/reactivate them (NIC as primary key). Profile details are self-managed by each Prosumer from the mobile app.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by NIC, name or email…"
              className="w-64 border border-[#E6DDC4] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F6B45]"
            />
            {canManage && (
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold hover:bg-[#265939] transition-colors whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Prosumer
              </button>
            )}
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
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#A9A290]">No prosumers found.</td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.nic} className="border-b border-[#F0EDE0] last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-6 py-3 font-medium text-[#22201A]">{p.nic}</td>
                    <td className="px-4 py-3 text-[#403A2E]">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-[#726A58]">{p.email}</td>
                    <td className="px-4 py-3 text-[#726A58]">{p.phoneNumber}</td>
                    <td className="px-4 py-3"><StatusPill isActive={p.isActive} /></td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p)}
                            className={
                              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ' +
                              (p.isActive
                                ? 'bg-white border border-[#E6DDC4] text-[#C0392B] hover:bg-[#FBE9E7]'
                                : 'bg-[#2F6B45] text-white hover:bg-[#265939]')
                            }
                          >
                            {p.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
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
