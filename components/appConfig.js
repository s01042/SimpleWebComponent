/**
 * let's centralize the appConfig in a class
 */
export default class AppConfig {

    locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='
    weatherServiceURL = 'https://www.metaweather.com/api/location/'
    CORSProxyURL_PROD = 'https://cors-anywhere.herokuapp.com/'
    CORSProxyURL_DEV = 'http://localhost:8080/'
    weatherIconBaseUrl = 'https://www.metaweather.com/static/img/weather/'
    isRunningInDevEnvironment

    /**
     * 
     * @param {*} isRunningInDevEnvironment 
     */
    constructor(isRunningInDevEnvironment = false) {
        this.isRunningInDevEnvironment = isRunningInDevEnvironment
    }

    get weatherIconBaseUrl() {
        return this.weatherIconBaseUrl
    }

    get locationServiceURL() {
        return this.locationServiceURL
    }

    get weatherServiceURL() {
        return this.weatherServiceURL
    }

    get CORSProxyURL() {
        return (this.isRunningInDevEnvironment ? this.CORSProxyURL_DEV :  this.CORSProxyURL_PROD)
    }
}
