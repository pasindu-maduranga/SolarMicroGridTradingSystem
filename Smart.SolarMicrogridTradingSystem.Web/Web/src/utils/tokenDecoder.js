import jwtDecode from "jwt-decode";

export default {
  getUserNameFromToken,
  getUserIDFromToken,
  isTokenExists,
  getRoleIDFromToken,
  getRoleLevelFromToken,
  getGroupIDFromToken,
  getFactoryIDFromToken,
  getRoleNameFromToken
}

function getFactoryIDFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  return decoded.factoryID;
}


function getGroupIDFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  return decoded.groupID;
}

function getUserNameFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  var userName = decoded.userName || decoded.given_name;
  return userName;
}

function getUserIDFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  return decoded.nameid;
}

function isTokenExists() {
  var token = sessionStorage.getItem('token');
  if (token == null || token == undefined) {
    return false;
  }
  return true;
}

function getRoleIDFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  return decoded.roleID;
}

function getRoleLevelFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  return Number(decoded.roleLevel);
}

function getRoleNameFromToken() {
  var token = sessionStorage.getItem('token').toString();
  var decoded = jwtDecode(token);
  var roleName = decoded.roleName;
  return roleName;
}

