/**
 * this is a simple serviceComponent Class
 * in it i will bundle my data access functionality eg. 
 * fetch data from web service, post data to web service,
 * persist data localy etc.
 */
export default class serviceComponent {

    constructor() {
        this.locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='
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
     */
    getNearestCity() {

        this.getGeolocation().then( result => {
            // object deconstruction
            const {
                coords: {latitude: lat},
                coords: {longitude: long}
                
            } = result
            // build webservice url
            let serviceUrl = this.locationServiceURL + lat + ',' + long
            // and use the CORS Proxy
            fetch(this.CORSProxyURL_PROD + serviceUrl)
                .then( response => {
                    if( response.ok ) {
                        response.json()
                        .then(data => {
                            alert(JSON.stringify(data))
                        })
                    } else {
                        alert(`HTTP error: ${response.status}`)
                    }
                })
                .catch(error => {
                    alert(error)
                })
        }).catch( e => {
            console.log(e)
        })
    }

}