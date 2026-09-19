var screenConfigs = sessionStorage.getItem('screenConfigurations');
var configurations = JSON.parse(screenConfigs);

export const CommonScreenConfigurationFetcher = (screenCode) => {

    if (configurations === null || configurations === undefined) {
        console.log("Please configure need to be configured") //Keep this console to log errors
        return null
    }

    if (configurations[0].screenCode === screenCode) {
        return configurations[0].configurations
    }

}