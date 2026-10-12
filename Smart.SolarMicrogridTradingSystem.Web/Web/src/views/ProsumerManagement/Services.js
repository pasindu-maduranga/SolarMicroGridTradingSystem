import { CommonGet, CommonPost, CommonPut } from '../../helpers/HttpClient';
import tokenDecoder from '../../utils/tokenDecoder';

export default {
  getAllProsumers,
  getPendingProsumers,
  getProsumerByNic,
  createProsumer,
  updateProsumer,
  approveProsumer,
  rejectProsumer
};

// Backoffice-created accounts are approved immediately (two calls, reusing the same
// create/approve endpoints the mobile self-registration + approval workflow already uses) -
// there's no reason for an account Backoffice itself is creating to sit in Pending.
async function createProsumer(prosumer) {
  const createModel = {
    nic: prosumer.nic,
    firstName: prosumer.firstName,
    lastName: prosumer.lastName,
    email: prosumer.email,
    password: prosumer.password,
    phoneNumber: prosumer.phoneNumber,
    address: prosumer.address,
    latitude: prosumer.latitude,
    longitude: prosumer.longitude,
    isActive: true,
    createdBy: tokenDecoder.getUserIDFromToken()
  };
  const response = await CommonPost('/api/Prosumer', null, createModel);
  if (response.statusCode === 'Success') {
    await approveProsumer(prosumer.nic);
  }
  return response;
}

async function getProsumerByNic(nic) {
  const response = await CommonGet('/api/Prosumer/' + nic, null);
  return response.data;
}

// Only ever called here to flip isActive (deactivate/reactivate) - bio fields are re-sent
// unchanged to satisfy the API's required-fields contract, never edited from the web.
async function updateProsumer(prosumer) {
  const updateModel = {
    firstName: prosumer.firstName,
    lastName: prosumer.lastName,
    email: prosumer.email,
    phoneNumber: prosumer.phoneNumber,
    address: prosumer.address,
    isActive: prosumer.isActive,
    modifiedBy: tokenDecoder.getUserIDFromToken()
  };
  const response = await CommonPut('/api/Prosumer/' + prosumer.nic, null, updateModel);
  return response;
}

async function getAllProsumers() {
  const response = await CommonGet('/api/Prosumer', null);
  return response.data;
}

async function getPendingProsumers() {
  const response = await CommonGet('/api/Prosumer/pending', null);
  return response.data;
}

async function approveProsumer(nic) {
  const response = await CommonPut('/api/Prosumer/' + nic + '/approve', null, {
    approvedBy: tokenDecoder.getUserIDFromToken()
  });
  return response;
}

async function rejectProsumer(nic, reason) {
  const response = await CommonPut('/api/Prosumer/' + nic + '/reject', null, {
    reason,
    rejectedBy: tokenDecoder.getUserIDFromToken()
  });
  return response;
}
