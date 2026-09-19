export default {
    ReadAllConfigs,
    ReadDomainConfiguration,
    ReadScreenConfigurations,
    ReadConnectionCheckConfig
}

async function ReadAllConfigs() {
    return await fetch("/webConfiguration.json")
        .then(response => {
            return response.json();
        })
        .then(jsondata => {
            return jsondata
        });
}

async function ReadDomainConfiguration() {
    return await fetch("/webConfiguration.json")
        .then(response => {
            return response.json();
        })
        .then(jsondata => {
            var urls = {
                apidomain: jsondata.apidomain,
                reactDomain: jsondata.reactDomain,
            };

            return urls
        });
}

async function ReadScreenConfigurations() {
    return await fetch("/webConfiguration.json")
        .then(response => {
            return response.json();
        })
        .then(jsondata => {
            if (jsondata.screenConfigurations !== null) {
                return jsondata.screenConfigurations
            }
            return null;
        });
}

async function ReadConnectionCheckConfig() {
    return await fetch("/webConfiguration.json")
        .then(response => {
            return response.json();
        })
        .then(jsondata => {
            if (jsondata.connectionCheckConfig != undefined && jsondata.connectionCheckConfig != null) {
                return jsondata.connectionCheckConfig
            }
            return null;
        });
}