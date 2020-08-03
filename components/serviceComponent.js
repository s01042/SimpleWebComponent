/**
 * this is a simple serviceComponent Class
 * in it i will bundle all my data access functionality eg. 
 * fetch data from web service, post data to web service,
 * persist data locally etc.
 */
export default class ServiceComponent {

    appConfig = null
    dataSet = null
    myLocalStorage = null

    constructor(theAppConfig) {
        this.appConfig = theAppConfig
    }

    /**
     * this is not the perfect solution!
     * normally i would totaly wrapp the dataSet and only expose some
     * public interfaces to acceess data and to write data into the dataSet
     */
    getLocallyStoredData() {

        const that = this
        let promise = new Promise(function(resolve, reject) {
            //make sure, that the deserialization takes place only once
            if(that.dataSet != null) resolve (that.dataSet) 

            that.myLocalStorage = localStorage
            let data = that.myLocalStorage.getItem('s01042.GPSLogger.v1')
            //if the are no data in the localstorage create a new 
            //empty dataSet and return it
            if (data === null) {
                that.dataSet = new Map()
                resolve(that.dataSet)
            } else {
                //todo deserialize data and init this.dataSet
            }
        })
        return promise
    }

    /**
     * Immutable Objects!
     * 
     * at first sight this implementation might see a littel bit strange, but if 
     * you think about data binding in web components and also for example in React
     * then you will get a better understandig for what is going on here and why 
     * i do it this way.
     * Why the hell do we create a new map object every time we add a new element
     * in front of the existing ones? It is because another component might observe
     * the change of binded attributes. if another component is binded to the 
     * dataSet object via reference, then no changes will happen to this binding
     * if we only insert and remove elements in/from the referenced map object.
     * that is because the reference to the map object is still the same. 
     * to really trigger the attribute change
     * event, we need to change the object reference itself. we force this by creating a new 
     * map instance and handle it over to the binded component. this mechanism is called
     * Immutable objects. 
     * @param {*} theDataObject 
     */
    stackNewDataObject(theDataObject) {

        //preserve the this context because inside the
        //promise constructor this context will change
        const that = this

        let promise = new Promise (function (resolve, reject) {

            if (that.dataSet === null) {
                reject(`no dataSet present. try to call 'getLocallyStoredData' first`)
                //todo: maybe call getLocallyStoredData here instead of rejecting the promise?
            }
            var newMap = new Map()
            //insert the new element at first position
            newMap.set (theDataObject.ID, theDataObject)
            //then add the existing ones
            that.dataSet.forEach ( entry => {
                newMap.set (entry.ID, entry)
            })
            //then set the reference to the newly created map object
            that.dataSet = newMap
            //and resolve the promise
            resolve(that.dataSet)
        })
        return promise
    }

    /**
     * navigator.geolocation.getCurrentPosition is async
     * so i wrapped it in a promise and make getGeolocation itself async 
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
     * this method returns the nearest cities from the given geocoordinates
     */
    getNearestCities(fromGeolocation) {

        // object deconstruction to get relevant data
        // from the geolocation object
        const {
            coords: {latitude: lat},
            coords: {longitude: long}
            
        } = fromGeolocation
        // build webservice url 
        let serviceUrl = this.appConfig.locationServiceURL + lat + ',' + long
        let proxyURL = this.appConfig.CORSProxyURL
        // now wrap the async call into a promise
        const promise = new Promise(function(resolve, reject) {
            // some things to remember:
            // inside the newly created promise (line 54) the context of this 
            // is changed, so the access to this.CORSProxyURL_DEV will fail!
            //
            // try to fetch the data using the CORS proxy
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

        let serviceUrl = this.appConfig.weatherServiceURL + theWOEID
        let proxyURL = this.appConfig.CORSProxyURL
        
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

    /**
     * i need IDs for my data entries so i will use
     * this implementation found on https://stackoverflow.com/questions/105034/how-to-create-guid-uuid
     */
    generateGUID = (typeof(window.crypto) != 'undefined' && 
                typeof(window.crypto.getRandomValues) != 'undefined') ?
        function() {
            // If we have a cryptographically secure PRNG, use that
            // https://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
            var buf = new Uint16Array(8)
            window.crypto.getRandomValues(buf)
            var S4 = function(num) {
                var ret = num.toString(16)
                while(ret.length < 4){
                    ret = "0"+ret
                }
                return ret
            }
            return (S4(buf[0])+S4(buf[1])+"-"+S4(buf[2])+"-"+S4(buf[3])+"-"+S4(buf[4])+"-"+S4(buf[5])+S4(buf[6])+S4(buf[7]))
        }

        :

        function() {
            // Otherwise, just use Math.random
            // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8)
                return v.toString(16)
            })
    }

}