export default class serviceComponent {

    constructor() {
        this.locationServiceURL = 'https://www.metaweather.com/api/location/search/?lattlong='

    }

    getGeolocation() {
        const promise = new Promise(function(resolve, reject) {
            if( 'geolocation' in navigator ) {
                navigator.geolocation.getCurrentPosition(
                    function(pos) {
                        resolve(pos)
                    },
                    function(error) {
                        reject(error)
                    }
                )
            } else {
                reject('geolocation API not supported in your browser')
            }
        })
        return promise
    }

    getNearestCity() {

        this.getGeolocation().then( result => {
            const {
                coords: {latitude: lat},
                coords: {longitude: long}
                
            } = result
            let serviceUrl = this.locationServiceURL + lat + ',' + long
            alert(serviceUrl)
            fetch(serviceUrl, {
                    mode: 'cors',
                    headers: {
                        //'Content-Type': 'application/json',                        
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        //'Access-Control-Allow-Origin': 'https://www.metaweather.com/api/',
                        //'Access-Control-Allow-Credentials' : true,
                        //'Access-Control-Allow-Origin':'*',
                        'Access-Control-Allow-Methods':'GET',
                        //'Access-Control-Allow-Headers':'application/json',
                    }
                })
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

}