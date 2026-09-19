import { CommonGet, CommonPost, CommonPut } from '../../../helpers/HttpClient';
import tokenDecoder from '../../../utils/tokenDecoder';

export default {
  getAllUsers,
  saveUser,
  getUserDetailsByID,
  updateUser,
  ResetPassword,
  getAllRoles,
  ChangePassword
};

async function getAllRoles() {
  const response = await CommonGet('/api/Role', null);
  return response.data;
}

async function getAllUsers() {
  const response = await CommonGet('/api/User', null);
  return response.data;
}

async function getUserDetailsByID(userID) {
  const response = await CommonGet('/api/User/' + userID, null);
  return response.data;
}

async function saveUser(user) {
  let saveModel = {
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleID,
    password: user.password,
    isActive: user.isActive,
    createdBy: tokenDecoder.getUserIDFromToken()
  }

  const response = await CommonPost('/api/User', null, saveModel);
  return response;
}

async function updateUser(user) {
  let updateModel = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleID,
    isActive: user.isActive,
    modifiedBy: tokenDecoder.getUserIDFromToken()
  }
  const response = await CommonPut('/api/User/' + user.userID, null, updateModel);
  return response;
}

async function ResetPassword(user) {
  let resetPasswordModel = {
    newPassword: user.newPassword,
    modifiedBy: tokenDecoder.getUserIDFromToken()
  }
  const response = await CommonPost('/api/User/' + user.userID + '/reset-password', null, resetPasswordModel);
  return response;
}

async function ChangePassword(changeModel) {
  const response = await CommonPost('/api/User/change-password', null, changeModel);
  return response;
}
