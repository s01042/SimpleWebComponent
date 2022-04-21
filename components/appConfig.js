/**
 * let's centralize the appConfig in a class
 */
export default class AppConfig {

    /**
     * maybe i should switch to https://openweathermap.org/
     * i'm not really satisfied with the quality of weather data from metaweather
     * trouble is, metaweather don't support cors header
     * 21.04.2022
     * I changed the implementation of the serviceComponent when consuming 
     * the weather webservice to get rid of the cors problems. I'm now hosting
     * my own web service proxy on heroku (see web service url in source code). 
     * no cors proxy needed anymore
     */
    //locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='
    locationServiceURL = 'https://infinite-castle-19858.herokuapp.com/api/getNearestCities?latlong='
    //weatherServiceURL = 'https://www.metaweather.com/api/location/'
    weatherServiceURL = 'https://infinite-castle-19858.herokuapp.com/api/getWeatherFromWOEID?woeid='
    weatherIconBaseUrl = 'https://www.metaweather.com/static/img/weather/'
    isRunningInDevEnvironment

    /**
     * these are the relevant informations for the consumption of the
     * google drive REST API.
     * IMPORTAND:   check https://console.developers.google.com/ for your security 
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
     * default for isRunningInDevEnvironment is FALSE
     * this param is optional
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
