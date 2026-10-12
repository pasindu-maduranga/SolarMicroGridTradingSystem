import React, { useState, useEffect } from 'react';
import { useAlert } from 'react-alert';
import { LoadingComponent } from 'src/utils/newLoader';
import Page from 'src/components/Page';
import { useNavigate, useParams } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import tokenService from 'src/utils/tokenDecoder';
import { groupBy } from 'lodash';
import services from '../Services';
import roleServices from '../../Role/Services';

const PermCheckbox = ({ checked, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={
      'inline-flex items-center justify-center w-6 h-6 rounded-md border transition-colors ' +
      (checked ? 'bg-[#2F6B45] border-[#2F6B45]' : 'bg-white border-[#D8D2BE]') +
      (disabled ? ' opacity-40 cursor-not-allowed' : ' hover:border-[#2F6B45] cursor-pointer')
    }
  >
    {checked && (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

export default function PermissionListing() {
  const [permission, setPermission] = useState([]);
  const [screen, setScreen] = useState([]);
  const [unmodifiedPermission, setUnmodifiedPermission] = useState([]);
  const [updatingRoleID, setUpdatingRoleID] = useState();
  const [updatingRoleLevelID, setUpdatingRoleLevelID] = useState();
  const [roleName, setRoleName] = useState('');
  const [isSaveDisable, setIsSaveDisable] = useState(false);
  const [isDataLoad, setDataLoadTrue] = useState(false);

  const alert = useAlert();
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const decryptedRole = atob(params.roleID.toString());
    const decryptedRoleLevelID = atob(params.roleLevelID.toString());
    if (decryptedRole != 0) {
      setUpdatingRoleID(decryptedRole);
      setUpdatingRoleLevelID(decryptedRoleLevelID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!updatingRoleID) {
      return;
    }

    if (tokenService.getRoleLevelFromToken() != 1 && updatingRoleID == tokenService.getRoleIDFromToken()) {
      setIsSaveDisable(true);
    } else {
      setIsSaveDisable(false);
    }

    trackPromise(getAllPermission());
    roleServices.getRoleDetailsByID(updatingRoleID).then((data) => setRoleName(data?.roleName || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatingRoleID]);

  useEffect(() => {
    if (updatingRoleLevelID === undefined) {
      return;
    }
    if (updatingRoleLevelID < tokenService.getRoleLevelFromToken()) {
      setIsSaveDisable(true);
    } else {
      setIsSaveDisable(false);
    }
  }, [updatingRoleLevelID]);

  async function getAllPermission() {
    const permissionData = await services.getPermissionNameAndScreenNameForCheckbox(tokenService.getRoleIDFromToken(), updatingRoleID);

    setScreen(permissionData.data.screens);
    setPermission(permissionData.data.permissions);
    setUnmodifiedPermission(permissionData.data.unmodifiedPermissions);

    if (permissionData.data.screens.length > 0) {
      setDataLoadTrue(true);
    }
  }

  function handlePermissionChange(permissionID) {
    setPermission((prev) => prev.map((p) => (p.permissionID === permissionID ? { ...p, isAssigned: !p.isAssigned } : p)));
  }

  function handleSelectAllForModule(moduleScreens) {
    const screenIDs = moduleScreens.map((s) => s.screenID);
    const relevant = permission.filter((p) => screenIDs.includes(p.screenID));
    const allOn = relevant.length > 0 && relevant.every((p) => p.isAssigned);
    setPermission((prev) => prev.map((p) => (screenIDs.includes(p.screenID) ? { ...p, isAssigned: !allOn } : p)));
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaveDisable(true);

    const response = await services.saveRolePermission(unmodifiedPermission, permission, updatingRoleID);

    alert.success(response.message);
    if (response.statusCode === 'Success') {
      setTimeout(() => {
        navigate('/app/roles/listing');
      }, 1500);
    }
  }

  const groupedModules = groupBy(screen, (s) => s.parentMenuName || 'General');

  return (
    <Page title="Role Permissions" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <button
        type="button"
        onClick={() => navigate('/app/roles/listing')}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#5C3D0E] mb-4 hover:underline"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        All roles
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Role Permissions</h1>
          <p className="text-sm text-[#726A58] mt-1">
            {roleName ? `Control which screens and actions ${roleName} can access.` : 'Control which screens and actions this role can access.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {Object.entries(groupedModules).map(([moduleName, moduleScreens]) => {
          const screenIDs = moduleScreens.map((s) => s.screenID);
          const relevant = permission.filter((p) => screenIDs.includes(p.screenID));
          const moduleAllOn = relevant.length > 0 && relevant.every((p) => p.isAssigned);

          return (
            <div key={moduleName} className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#E6DDC4]">
                    <th className="text-left px-5 py-3">
                      <div className="flex items-center gap-2.5 font-sans font-bold text-[#22201A]">
                        <PermCheckbox checked={moduleAllOn} onClick={() => handleSelectAllForModule(moduleScreens)} />
                        <span>{moduleName}</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#726A58] w-28">View</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#726A58] w-28">Add &amp; Edit</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#726A58] w-28">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleScreens.map((s) => (
                    <tr key={s.screenID} className="border-b border-[#F0EDE0] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-5 py-3 text-[#403A2E]">{s.screenName}</td>
                      {permission
                        .filter((p) => p.screenID === s.screenID)
                        .map((p) => (
                          <td key={p.permissionID} className="px-4 py-3 text-center">
                            <PermCheckbox
                              checked={p.isAssigned}
                              disabled={s.screenName === 'Role Permission'}
                              onClick={() => handlePermissionChange(p.permissionID)}
                            />
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {isDataLoad && (
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isSaveDisable}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold hover:bg-[#265939] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        )}
      </form>
    </Page>
  );
}
