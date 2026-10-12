var url = sessionStorage.getItem('urls');
var configUrls = JSON.parse(url);

export default {
    apidomain: configUrls.apidomain,
    reactDomain: configUrls.reactDomain,

    idleTimeOut: 10, // Defined in minutes. More than 10 mins is preferred.
    sessionUpdateTimeInterval: 3 // Defined in minutes.
}