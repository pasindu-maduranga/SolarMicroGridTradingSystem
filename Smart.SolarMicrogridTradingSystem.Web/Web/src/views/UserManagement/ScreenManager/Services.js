import { CommonGet, CommonPost, CommonPut, CommonDelete } from '../../../helpers/HttpClient';

export default {
  GetAllParentMenuDetails,
  SaveParentMenuDetails,
  UpdateParentMenuDetails,
  GetAllMenuDetails,
  SaveMenuDetails,
  UpdateMenuDetails,
  GetAllScreenDetails,
  SaveScreenDetails,
  UpdateScreenDetails,
  DeleteMenuNode
};

async function GetAllParentMenuDetails() {
  const response = await CommonGet('/api/ParentMainMenu/GetAllParentMenuDetails', null)
  return response;
}

async function SaveParentMenuDetails(requestModel) {
  const response = await CommonPost('/api/ParentMainMenu/SaveParentMenuDetails', null, requestModel)
  return response;
}

async function UpdateParentMenuDetails(id, requestModel) {
  const response = await CommonPut('/api/ParentMainMenu/UpdateParentMenuDetails/' + id, null, requestModel)
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

async function UpdateMenuDetails(id, requestModel) {
  const response = await CommonPut('/api/Menu/UpdateMenuDetails/' + id, null, requestModel)
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

async function UpdateScreenDetails(id, requestModel) {
  const response = await CommonPut('/api/Menu/UpdateScreenDetails/' + id, null, requestModel)
  return response;
}

async function DeleteMenuNode(id) {
  const response = await CommonDelete('/api/Menu/' + id)
  return response;
}
