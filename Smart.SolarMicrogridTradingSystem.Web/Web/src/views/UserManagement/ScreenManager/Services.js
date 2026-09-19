import { CommonGet, CommonPost } from '../../../helpers/HttpClient';

export default {
  GetAllParentMenuDetails,
  SaveParentMenuDetails,
  GetAllMenuDetails,
  SaveMenuDetails,
  GetAllScreenDetails,
  SaveScreenDetails
};

async function GetAllParentMenuDetails() {
  const response = await CommonGet('/api/ParentMainMenu/GetAllParentMenuDetails', null)
  return response;
}

async function SaveParentMenuDetails(requestModel) {
  const response = await CommonPost('/api/ParentMainMenu/SaveParentMenuDetails', null, requestModel)
  return response;
}

async function GetAllMenuDetails() {
  const response = await CommonGet('/api/Menu/GetAllMenuDetails', null)
  return response;
}

async function SaveMenuDetails(requestModel) {
  const response = await CommonPost('/api/Menu/SaveMenuDetails', null, requestModel)
  return response;
}

async function GetAllScreenDetails() {
  const response = await CommonGet('/api/Menu/GetAllScreenDetails', null)
  return response;
}

async function SaveScreenDetails(requestModel) {
  const response = await CommonPost('/api/Menu/SaveScreenDetails', null, requestModel)
  return response;
}
