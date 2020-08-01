/**
 * this is a simple serviceComponent Class
 * in it i will bundle my data access functionality eg. 
 * fetch data from web service, post data to web service,
 * persist data localy etc.
 */
export default class serviceComponent {

    constructor() {
        this.locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='
        this.weatherServiceURL = 'https://www.metaweather.com/api/location/'
        this.CORSProxyURL_PROD = 'https://cors-anywhere.herokuapp.com/'
        this.CORSProxyURL_DEV = 'http://localhost:8080/'
    }

    /**
     * navigator.geolocation.getCurrentPosition is async
     * so i wrapped it in a promise and make getGeolocation async itself
     */
    getGeolocation() {
        const promise = new Promise(function(resolve, reject) {
            if( 'geolocation' in navigator ) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve(pos)
                    },
                    (error) => {
                        reject(error)
                    }
                )
            } else {
                reject('geolocation API not supported in your browser')
            }
        })
        return promise
    }

    /**
     * look here for further information on CORS: 
     * https://fetch.spec.whatwg.org/#concept-method
     * 
     * this method returns the nearest city from the given geocoordinates
     */
    getNearestCities(fromGeolocation) {

        // object deconstruction to get relevant data
        // from the geolocation
        const {
            coords: {latitude: lat},
            coords: {longitude: long}
            
        } = fromGeolocation
        // build webservice url 
        let serviceUrl = this.locationServiceURL + lat + ',' + long
        let proxyURL = this.CORSProxyURL_PROD
        // now wrap the async call into a promise
        const promise = new Promise(function(resolve, reject) {
            // some things to remember:
            // inside the newly created promise (line 54) the context of this 
            // is changed, so the access to this.CORSProxyURL_DEV will fail!
            //
            // and try to fetch the data using the CORS proxy
            fetch(proxyURL + serviceUrl)
                .then( response => {
                    if( response.ok ) {
                        // we await json data from the web service call
                        response.json()
                        .then(data => {
                            // data is an array of locations sorted by distance
                            // so the nearest locations are first in the array
                            // i want the first 3 elements and use object deconstruction
                            let [first, second, third] = data
                            resolve([first, second, third])
                        })
                    } else {
                        reject(`HTTP error: ${response.status}`)
                    }
                })
                .catch(error => {
                    reject(error)
                })
        })
        return promise
    }

    /**
     * 
     * @param {*} theWOEID the 'Where On Earth ID' of the city
     * 
     * the call of the web service at metaweather will return the weather data
     * for 6 days. i am only interessted in the data for the actual day. i am not
     * interessted in the forecast data.
     */
    getWeatherFromWOEID(theWOEID) {

        let serviceUrl = this.weatherServiceURL + theWOEID
        let proxyURL = this.CORSProxyURL_PROD
        
        return new Promise(function(resolve, reject) {
            try {
                fetch(proxyURL + serviceUrl)
                    .then( response => {
                        if( response.ok ) {
                            response.json()
                                .then( data => {
                                    resolve(data)
                                })
                        } else {
                            reject(`oops, something went wrong: ${reponse.status}`)
                        }                       
                    })
                    .catch( e => {
                        reject(e)
                    })
            }
            catch(exception) {
                reject(exception)
            }
        })
    }

}