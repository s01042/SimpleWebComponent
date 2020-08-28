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
     * 
     * the localstorage is bound to the protocol AND the domain which is
     * serving the corresponding web site. 
     */
    getLocallyStoredData() {

        const that = this
        let promise = new Promise(function(resolve, reject) {
            //make sure, that the deserialization takes place only once
            //if dataSet is not null, we are here not for the first time
            if(that.dataSet != null) resolve (that.dataSet) 

            that.myLocalStorage = localStorage
            let persistedData = that.myLocalStorage.getItem('s01042.GPSLogger.v1')
            if (persistedData != null) {
                that.dataSet = new Map(JSON.parse(persistedData, that.reviver))
            }
            //if there are no data in the localstorage create a new 
            //empty dataSet and return it
            if (that.dataSet == null) {
                that.dataSet = new Map()
                resolve(that.dataSet)
            } else {
                resolve(that.dataSet)
            }
        })
        return promise
    }

    /**
     * Immutable Objects!
     * 
     * at first sight this implementation might see a little bit strange, but if 
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
            //this should never happen because the app will start 
            //with a call of getLocallyStoredData which will initialize 
            //the dadaSet
            if (that.dataSet === null) {
                reject(`no dataSet present. try to call 'getLocallyStoredData' first`)
                //todo: maybe call getLocallyStoredData here instead of rejecting the promise?
            }
            var newMap = new Map()
            //insert the new element at first position
            newMap.set (theDataObject.ID, theDataObject)
            //then add the existing ones after the new one
            that.dataSet.forEach ( entry => {
                //todo: does map preserve the item order?
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
     * 
     * @param {*} theMappedData 
     */
    persistDataLocally(theMappedData) {
        //store the data locally. only strings are allowed
        try {
            //can't stringify a javascript map object directly
            //either convert to an array eg. [...theMappedData]
            //which only works for one dimensional maps
            //or use a replacer function when stringify
            let stringToStore = JSON.stringify(theMappedData, this.replacer)
            this.myLocalStorage.setItem('s01042.GPSLogger.v1', stringToStore)
            return true
        }
        catch (e) {
            return false
        }
        
    }

    /**
     * completly new to me! PART 1
     * JSON.stringify can't stringify map objects
     * because the Map instance as it doesn't have any properties
     * the result would therefore be {}.
     * BUT stringify supports a second parameter 'replacer' and JSON.parse
     * supports a second parameter 'reviver'.
     * replacer will 'transform' a map into an array which stringify can work with
     * @param {*} key 
     * @param {*} value 
     */
    replacer(key, value) {
        //todo: check this syntax!
        const originalObject = this[key];
        if(originalObject instanceof Map) {
          return {
            dataType: 'Map',
            value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
          };
        } else {
          return value;
        }
    }

    /**
     * completly new to me! PART 2
     * this is the counterpart to replacer and will be used in JSON.parse to
     * reconstruct the map 
     * @param {*} key 
     * @param {*} value 
     */
    reviver(key, value) {
        if(typeof value === 'object' && value !== null) {
          if (value.dataType === 'Map') {
            return new Map(value.value);
          }
        }
        return value;
    }

    /**
     * navigator.geolocation.getCurrentPosition is async
     * so i wrapped it in a promise and make getGeolocation itself async 
     */
    getGeolocation() {
        const promise = new Promise(function(resolve, reject) {
            if( 'geolocation' in navigator ) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        /**
                         * my observations are: the position object returned
                         * by navigator.geolocation.getCurrentPosition is not
                         * 'stringifyable'. That's why i create a new simple object 
                         * with the same structure as position here that is stringifyable.
                         */
                        resolve({
                            coords: {
                                accuracy: position.coords.accuracy,
                                altitude: position.coords.altitude,
                                altitudeAccuracy: position.coords.altitudeAccuracy,
                                heading: position.coords.heading,
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                speed: position.coords.speed,
                            },
                            timestamp: position.timestamp,
                        })
                    },
                    (error) => {
                        reject(error)
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: 5000
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