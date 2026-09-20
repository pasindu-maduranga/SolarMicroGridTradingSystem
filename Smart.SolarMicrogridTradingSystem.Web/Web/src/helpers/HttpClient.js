import config from "react-global-configuration";
import dev from '../config/dev';
import axios from 'axios';


var serviceUrl = dev.apidomain;

export const CommonGet = (url, queryString) => {

    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        if (queryString != null) {
            request.open("GET", serviceUrl + url + "?" + queryString);
        } else {
            request.open("GET", serviceUrl + url);
        }

        request.setRequestHeader("Content-type", "application/json; charset=utf-8");
        request.setRequestHeader('Access-Control-Allow-Methods', '*');
        request.setRequestHeader('Accept-Language', 'en-US');
        request.onload = () => {

            if (request.response === 'Token Time Exceed') {
                window.logout.logout();
            }
            else {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.response));
                } else {
                    reject(request.statusText);
                }
            }
        };
        request.onerror = () => {
            reject(request.statusText);
        };
        request.send();
    });
};

export const CommonGetAxios = async (url, queryString) => {

    let originURL;
    const header = {
        "Content-type": "application/json; charset=utf-8",
        'Access-Control-Allow-Methods': '*',
        'Accept-Language': 'en-US'
    }

    if (queryString != null) {
        originURL = serviceUrl + url + "?" + queryString;
    } else {
        originURL = serviceUrl + url;
    }

    return await axios.get(originURL, [header]).then(response => {

        if (response.statusText === 'Token Time Exceed') {
            window.logout.logout();
        } else {
            if (response.status >= 200 && response.status < 300) {
                return (response.data);
            } else {
                return response.statusText;
            }
        }
    });
};

export const CommonPost = (url, queryString, body) => {
    const encryptedResult = JSON.stringify(body);
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        if (queryString != null) {
            request.open("POST", serviceUrl + url + "?" + queryString);
        } else {
            request.open("POST", serviceUrl + url);
        }

        request.setRequestHeader("Content-type", "application/json; charset=utf-8");
        request.setRequestHeader('Access-Control-Allow-Methods', '*');
        request.setRequestHeader('Accept-Language', 'en-US');
        request.onload = () => {
            if (request.response === 'Token Time Exceed') {
                window.logout.logout();
            }
            else {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.response));
                } else {
                    reject(request.statusText);
                }
            }
        };
        request.onerror = () => {
            reject(request.statusText);
        };
        request.send(encryptedResult);
    });
};


export const CommonPut = (url, queryString, body) => {
    const encryptedResult = JSON.stringify(body);
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        if (queryString != null) {
            request.open("PUT", serviceUrl + url + "?" + queryString);
        } else {
            request.open("PUT", serviceUrl + url);
        }

        request.setRequestHeader("Content-type", "application/json; charset=utf-8");
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                resolve(JSON.parse(request.response));
            } else {
                reject(request.statusText);
            }
        };
        request.onerror = () => {
            reject(request.statusText);
        };
        request.send(encryptedResult);
    });
};

export const CommonDelete = (url) => {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("DELETE", serviceUrl + url);
        request.setRequestHeader("Content-type", "application/json; charset=utf-8");
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                resolve(JSON.parse(request.response));
            } else {
                reject(request.statusText);
            }
        };
        request.onerror = () => {
            reject(request.statusText);
        };
        request.send();
    });
};

export const CommonPostAxios = async (url, queryString, body) => {
    const encryptedResult = JSON.stringify(body);
    let originURL;


    const options = {
        headers: {
            "Content-type": "application/json; charset=utf-8",
            'Access-Control-Allow-Methods': '*',
            'Accept-Language': 'en-US'
        }
    };

    if (queryString != null) {
        originURL = serviceUrl + url + "?" + queryString;
    } else {
        originURL = serviceUrl + url;
    }

    return await axios.post(originURL, encryptedResult, options).then(response => {

        if (response.statusText === 'Token Time Exceed') {
            window.logout.logout();
        } else {
            if (response.status >= 200 && response.status < 300) {
                return (response.data);
            } else {
                return response.statusText;
            }
        }
    });

}



