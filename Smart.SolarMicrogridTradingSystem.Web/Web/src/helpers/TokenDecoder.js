import jwt_decode from "jwt-decode";

export default {
    getUserNameFromToken,
    getUserIDFromToken,
    getRoleFromToken,
    isTokenExists
}

function getUserNameFromToken() {
    var token = sessionStorage.getItem('token');
    var decoded = jwt_decode(token);
}

function getUserIDFromToken() {
    var token = sessionStorage.getItem('token');
    var decoded = jwt_decode(token);
    return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
}

function getRoleFromToken() {
    var token = sessionStorage.getItem('token');
    var decoded = jwt_decode(token);
    return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
}

function isTokenExists(){
    var token = sessionStorage.getItem('token');

    if(token == null || token == undefined){
        return false;
    }

    return true;
}