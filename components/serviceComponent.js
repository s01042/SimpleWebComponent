export default class serviceComponent {

    constructor() {
        this.locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='
        this.CORSProxyURL = 'https://cors-anywhere.herokuapp.com/'
    }

    /**
     * navigator.geolocation.getCurrentPosition is async
     * so i wrapp it in a promise and make getGeolocation async itself
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
            alert(serviceUrl)
            console.log(`try with CORS Proxy: ${this.CORSProxyURL + serviceUrl}`)
            console.log(`service URL is: ${serviceUrl}`)
            fetch(this.CORSProxyURL + serviceUrl)
                .then( response => {
                    if( response.ok ) {
                        response.json()
                        .then(data => {
                            alert(data)
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

    getNearestCityWithJSONP() {
        this.getGeolocation()
            .then( result => {
                // object deconstruction
                const {
                    coords: {latitude: lat},
                    coords: {longitude: long}
                    
                } = result
                // build webservice url
                let serviceUrl = this.locationServiceURL + lat + ',' + long
                this.requestServerCall(serviceUrl)
            })
            .catch( e => {
                console.log(e)
            })
    }

    //Construct the script tag at Runtime
    requestServerCall(url) {
        url = url + '&callback=jsonpCallback'
        alert(`trying JSONP with ${url}`)
        var head = document.head;
        var script = document.createElement("script");
        script.setAttribute("src", url);
        head.appendChild(script);
        head.removeChild(script);
    }

    jsonpCallback(data) {
        alert(data.message); // Response data from the server
    }
}