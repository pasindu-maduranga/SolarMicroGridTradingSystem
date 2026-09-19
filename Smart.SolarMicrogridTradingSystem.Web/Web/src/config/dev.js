var url = sessionStorage.getItem('urls');
var configUrls = JSON.parse(url);

export default {
    apidomain: configUrls.apidomain,
    reactDomain: configUrls.reactDomain,

    key: 'rkv3ebsuGZM8a/x/bXAdmz++b1FIj97x0ui90orQdHM=',
    iv:'f/JWlbtLPA/ux7ypiZc3oQ==',
    idleTimeOut: 10, // Defined in minutes. More than 10 mins is preferred.
    sessionUpdateTimeInterval: 3 // Defined in minutes.
}