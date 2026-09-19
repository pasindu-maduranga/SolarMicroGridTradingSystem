import { CommonPost } from '../../helpers/HttpClient';

export default {
    login
};

async function login(data) {
    let body = {
        username: data.username,
        password: data.password
    }
    const response = await CommonPost('/api/auth/login', null, body);
    return response;
}