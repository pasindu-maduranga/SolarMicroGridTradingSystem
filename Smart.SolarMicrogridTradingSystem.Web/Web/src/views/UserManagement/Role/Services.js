import { CommonGet, CommonPost, CommonPut } from '../../../helpers/HttpClient';
import tokenDecoder from '../../../utils/tokenDecoder';

export default {
  saveRole,
  getRoleDetailsByID,
  updateRole,
  getAllRoles
};

async function saveRole(role) {
  let saveModel = {
    roleName: role.roleName,
    level: role.level,
    isActive: role.isActive,
    createdBy: tokenDecoder.getUserIDFromToken()
  }

  const response = await CommonPost('/api/Role', null, saveModel);
  return response;
}

async function updateRole(role) {
  let updateModel = {
    roleName: role.roleName,
    level: role.level,
    isActive: role.isActive,
    modifiedBy: tokenDecoder.getUserIDFromToken()
  }

  const response = await CommonPut('/api/Role/' + role.roleID, null, updateModel);
  return response;
}

async function getAllRoles() {
  const response = await CommonGet('/api/Role', null);
  return response.data;
}

async function getRoleDetailsByID(roleID) {
  const response = await CommonGet('/api/Role/' + roleID, null);
  return response.data;
}
