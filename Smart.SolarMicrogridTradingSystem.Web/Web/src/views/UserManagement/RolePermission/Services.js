import { CommonGet, CommonPost } from '../../../helpers/HttpClient';

export default {

  getPermissionNameAndScreenNameForCheckbox,
  saveRolePermission
};


async function getPermissionNameAndScreenNameForCheckbox(loggedRoleID, assigningRoleID) {

  const response = await CommonGet('/api/RolePermission/GetPermissionByRoleId', 'loggedRoleID=' + loggedRoleID + '&assigningRoleID=' + assigningRoleID);

  return response;
}

async function saveRolePermission(unmodifiedPermissions, modifiedPermissions, roleID) {
  var requestModel = {
    unmodifiedList: unmodifiedPermissions,
    modifiedList: modifiedPermissions,
    roleID: roleID
  }

  const response = await CommonPost('/api/RolePermission/SaveRolePermission', null, requestModel);
  return response;
}
