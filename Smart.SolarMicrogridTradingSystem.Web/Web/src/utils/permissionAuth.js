import { CommonGet, CommonPost } from '../helpers/HttpClient';
import tokenService from '../utils/tokenDecoder';

export default {
    getPermissionsByScreen
};

async function getPermissionsByScreen(screenCode) {

    const response = await CommonGet('/api/Permission/GetPermissionsByRoleAndScreen', 'roleID=' + tokenService.getRoleIDFromToken() + '&screenCode=' + screenCode);


    return response.data;
}
