var url = sessionStorage.getItem('urls');
var configUrls = url ? JSON.parse(url) : {};

export default {
    apidomain: configUrls.apidomain || 'http://localhost:5050',
    reactDomain: configUrls.reactDomain || 'http://localhost:5020',

    idleTimeOut: 10, // Defined in minutes. More than 10 mins is preferred.
    sessionUpdateTimeInterval: 3 // Defined in minutes.
}