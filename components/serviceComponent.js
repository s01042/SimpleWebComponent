
/**
 * this is a serviceComponent Class
 * it will handle all my data access functionality eg. 
 * fetch data from web service, post data to web service,
 * persist data locally etc.
 */
export default class ServiceComponent {

    appConfig = null
    dataSet = null
    myLocalStorage = null    
    gapi = null                     // google api
    googleFileID = null
    currentGoogleUser = null
    onSignedInChanged = null

    constructor(theAppConfig) {
        this.appConfig = theAppConfig
        this.appConfig.ApiKey = localStorage.getItem ('s01042.GPSLogger.v1.ApiKey')
        this.appConfig.ClientID = localStorage.getItem ('s01042.GPSLogger.v1.ClientID')
        this.googleFileID = localStorage.getItem('s01042.GPSLogger.v1.GoogleFileID') 
        this.appConfig.FileID = this.googleFileID

    }

    updateAppConfig() {
        localStorage.setItem ('s01042.GPSLogger.v1.ApiKey', this.appConfig.ApiKey)
        localStorage.setItem ('s01042.GPSLogger.v1.ClientID', this.appConfig.ClientID)
    }

    /**
     * here i handle all the stuff with gapi init and google oauth
     * this method will return a promise with the basicUserProfile of
     * the logged in google user
     */
    loginWithGoogle() {
        let self = this
        const promise = new Promise ((resolve, reject) => {
            if (! self.gapi) {
                self.loadGapi ().then ( () => {
                    self.gapi = gapi        // store ref for later use
                    self.initializeGapi ().then ( () => {
                        self.doGoogleSignIn ().then (googleUser => {
                            self.currentGoogleUser = googleUser
                            let basicProfile = self.currentGoogleUser.getBasicProfile()
                            console.log (`current Google User is: ${basicProfile.getName()} (${basicProfile.getEmail()}), ${basicProfile.getImageUrl()}`)
                            resolve (basicProfile)
                        })
                    }).catch (error => {
                        reject (error)
                    })
                }).catch (error => {
                    reject (error)
                })
            } else {
                let basicProfile = self.currentGoogleUser.getBasicProfile()
                resolve (basicProfile)
            }
        })
        return promise
    }

    /**
     * this is how postDataToGoogleDrive works:
     * if i use this app on different devices, every device will collect 
     * its own set of data and store them locally in the local storage on the device.
     * to avoid the concurrent overwriting of this data in one single google drive file every device
     * has to store its own data in a google drive file that is "owned" by the app instance.
     * that's why every app instance will deal with its own google drive file id.
     * in the first attempt of storing data on google drive there will be no such google drive 
     * file id owned by the app. that forces the app to create a new google drive file. 
     * in response to that event the app will receive a google file id for this newly created file 
     * and will store it in local storage for later use. if a file id is present the app will use updateFile 
     * to override the file content of its "owned file" on google drive with the new data.
     */
    postDataToGoolgeDrive() {
        let self = this     //preserve the this context
        const promise = new Promise (function (resolve, reject) {
            //if there is no googleFileID we create a new file 
            if (self.googleFileID == null) {
                self.createNewFile()
                    .then ( googleFileID => {
                        //lets ref and store the newly created DocId for further use
                        self.googleFileID = googleFileID
                        localStorage.setItem('s01042.GPSLogger.v1.GoogleFileID', googleFileID)
                        self.updateFile (googleFileID)
                            .then ( file => {
                                resolve (file)
                            })
                            .catch ( error => {
                                reject (error)
                            })
                    })
                    .catch (error => {
                        reject (error)
                    })
            } else {
                //todo: check if file with id still exists in google drive
                self.updateFile(self.googleFileID)
                    .then ( file => {
                        resolve (file)
                    })
                    .catch (error => {
                        reject (error)
                    })
            }
        })
        return promise
    }

    /**
     * 
     * @param {*} googleFileID the google file id of the document to update
     * 
     * this is a littel bit tricky, because we want to update some document metadata 
     * (especially the document description) and the document content at the same time. 
     * therefore we must build a multipart body.
     * see https://dev.to/arnabsen1729/using-google-drive-api-v3-to-upload-a-file-to-drive-using-react-4loi
     */
    async updateFile (googleFileID) {

        let self = this
        const promise = new Promise (function(resolve, reject) {

            //this is the service end point: https://www.googleapis.com/upload/drive/v3/files/fileId
            const serviceUrl = 'https://www.googleapis.com/upload/drive/v3/files/' + googleFileID
            let timeStamp = Date.now()
            
            const boundary ='s01042.GPSLogger.v1'
            const delimiter = "\r\n--" + boundary + "\r\n"
            const close_delim = "\r\n--" + boundary + "--"

            var fileData= localStorage.getItem('s01042.GPSLogger.v1')
            var contentType='application/json'
            var metadata = {
                'description': timeStamp,
                'mimeType': contentType
            };

            /** here it is important, that the metadata comes first, before the content data */
            let multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n\r\n' +
                fileData+'\r\n'+
                close_delim;

            var request = self.gapi.client.request({
                'path': serviceUrl,
                'method': 'PATCH',
                'params': {'uploadType': 'multipart'},
                'headers': {
                  'Content-Type': 'multipart/related; boundary=' + boundary + ''
                },
                'body': multipartRequestBody});
            request.execute (function (result) {
                if (result.error) {
                    reject (result.error)
                } else {
                    resolve (result)
                }
            })
        })
        return promise
    }


    /**
     * create a new empty file on google drive
     */
    async createNewFile() {
        
        const selft = this
        let timestamp = Date.now()
        let promise = new Promise (function (resolve, reject) {
            let fileMetaData = {
                name: "GPSLoggerData_" + timestamp + ".json",
                mimeType: 'text/json',
            }
            self.gapi.client.drive.files.create({
                resource: fileMetaData,
                fields: 'id'
            }).then (response => {
                resolve (response.result.id)
            }).catch (response => {
                reject (response.result.error)
            })    
        })
        return promise
    }

    /**
     * here i load the google drive api.js file
     * the onload binding is used to interact with the api when the js file is 
     * completly loaded and ready to use
     * 
     */
    loadGapi() {
        return new Promise ((resolve, reject) => {
            let head = document.head
            let script = document.createElement('script')
            script.type = 'text/javascript'
            script.src = 'https://apis.google.com/js/api.js'
            // onload will be called when the loading of the api.js file is completed
            // then the gapi object will be locally available for further use so 
            // we bind to resolve the promise to this event
            // we don't resolve the promise by ourself, but onload will do it
            script.onload = resolve 
            script.onerror = function (reason) {
                reject (reason)
            }
            // Fire the loading
            head.appendChild (script);        
        })
    }

    /**
     * we need to init the gapi client
     * 
     * we load the GoogleAuth class. this is a singleton class that provides
     * methods for signIn with a google account, get the user's current sign-in status, 
     * get specific data from the user's Google profile, request additional scopes 
     * and sign out from the current account.
     */
    initializeGapi () {
        let self = this
        let promise = new Promise ((resolve, reject) => {
            try {
                self.gapi.load('client:auth2', function() {
                    /** 
                     * ready to make a call to gapi.client.init 
                     * for clarification: google api's are managed api's with quotas etc.
                     * any app must be authorized to use a managed google api
                     * for that you must provide an ApiKey and a ClientID
                     * later on the app will access google resources on behalf of the user who own it
                     * for that reason the app must define the permissions that the user must
                     * granted. all this happens in gapi.client.init
                     * */
        
                    self.gapi.client.init ({
                        apiKey: self.appConfig.ApiKey,
                        clientId: self.appConfig.ClientID,
                        discoveryDocs: self.appConfig.DiscoveryDocs,
                        scope: self.appConfig.Scopes
                    }).then (function (){
                        // here we install an event handler listening for singnedIn changes
                        self.gapi.auth2.getAuthInstance().isSignedIn.listen( singnedIn => {
                            self.onSignedInStatusChanged (singnedIn)
                        })
                        resolve ()
                    })
                })
            } catch (e) {
                reject (e)
            }
        })
        return promise    
    }

    /**
     * notify about SignedInStatus changes
     * @param {*} singedIn 
     */
    onSignedInStatusChanged (singedIn) {
        let event = new CustomEvent ('onSignedInStatusChanged', {detail: singedIn})
        if (this.onSignedInChanged) this.onSignedInChanged (event)
    }

    /**
     * register an event listener
     * @param {*} eventName 
     * @param {*} callbackFunction 
     */
    addEventListener (eventName, callbackFunction) {
        if (eventName === 'onSignedInStatusChanged') {
            this.onSignedInChanged = callbackFunction
        }
    }


    /**
     * after loading and initializing gapi we can check the 
     * current login state and logon if necessary
     * the promise will be resolved with a googleUser object
     */
    doGoogleSignIn () {
        let self = this
        let promise = new Promise ((resolve, reject) => {
            const initialSignedIn = self.gapi.auth2.getAuthInstance().isSignedIn.get()
            if (! initialSignedIn) {
                self.gapi.auth2.getAuthInstance().signIn()
                    .then (googleUser => {
                        resolve (googleUser)
                    })
                    .catch (e => {
                        reject (e)
                    })
            } else {
                resolve (self.gapi.auth2.getAuthInstance().currentUser.get())
            }
        })
        return promise
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
    async stackNewDataObject(theDataObject) {

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
            this.dataSet = theMappedData
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
     * for 6 days. i am only interessted in the data for the current day. i am not
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