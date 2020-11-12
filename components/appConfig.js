/**
 * let's centralize the appConfig in a class
 */
export default class AppConfig {

    /**
     * maybe i should switch to https://openweathermap.org/
     * i'm not really satisfied with the quality of weather data from metaweather
     */
    locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='
    weatherServiceURL = 'https://www.metaweather.com/api/location/'
    CORSProxyURL_PROD = 'https://cors-anywhere.herokuapp.com/'
    CORSProxyURL_DEV = 'http://localhost:8080/'
    weatherIconBaseUrl = 'https://www.metaweather.com/static/img/weather/'
    isRunningInDevEnvironment

    /**
     * these are the relevant informations for the consumption of the
     * google drive REST API.
     * IMPORTAND:   check https://console.developers.google.com/ for your security settings
     *              especially for Javascript Origin settings
     */
    // your Client ID from the Google Developer Console goes here
    CLIENT_ID = null
    // your API Key from the Google Developer Console goes here
    API_KEY = null
    // Array of API discovery doc URLs for APIs used by the GPSLogger
    DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    SCOPES = 'https://www.googleapis.com/auth/drive.file'
    // the Google File ID 
    FILE_ID = null
    

    /**
     * 
     * @param {*} isRunningInDevEnvironment 
     */
    constructor(isRunningInDevEnvironment = false) {
        this.isRunningInDevEnvironment = isRunningInDevEnvironment
    }

    get FileID() {
        return this.FILE_ID
    }

    set FileID (newFileID) {
        this.FILE_ID = newFileID
    }

    get ClientID() {
        return this.CLIENT_ID
    }

    set ClientID (newID) {
        this.CLIENT_ID = newID
    }

    get ApiKey() {
        return this.API_KEY
    }

    set ApiKey (newApiKey) {
        this.API_KEY = newApiKey
    }

    get DiscoveryDocs() {
        return this.DISCOVERY_DOCS
    }

    get Scopes () {
        return this.SCOPES
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
