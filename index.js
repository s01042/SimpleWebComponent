/**
 * TODOs:
 * 
 * make an app class and inject the config object via class construtor
 * implement methods 
 * default export the app class
 * 
 * or even better: make the app class a web component itself then
 * the only html tag in the index.html would be <myApp />
 * 
 * I use ES6 modules here.
 */

import UserCard from './components/userCard.js'
import ServiceComponent from './components/serviceComponent.js'
import AppConfig from './components/appConfig.js'

const myAppConfig = new AppConfig() //runs in DEV environment
const myServiceComponent = new ServiceComponent(myAppConfig)

/**
 * this is a simple event handler that i bind to the 
 * custom event of the userCard component
 * @param {*} data 
 */
function myEventHandler(elementKey) {
    myServiceComponent.getLocallyStoredData()
        .then( map => {
            let selectedElement = map.get(elementKey)
            if (selectedElement) {
                alert(`eventhandler in index.js with ID data '${elementKey}'. this is '${selectedElement.email}'`)
            } else {
                alert(`no more data available for item with id '${elementKey}'`)
            }        
        })
}

function init() {
    installMenuEventHandler()

    myServiceComponent.getLocallyStoredData().then( res => {
        //todo iterate over the map and build card components dynamically
        console.dir(res)
    })

    /**
     * here we iterate over the declarative inserted user-card components and 
     * bind the event handler for selecting a card
     */
    let userCards = document.querySelectorAll('user-card')
    userCards.forEach( userCard => {
        userCard.addEventListener('onSelectCard', (e) => myEventHandler(e.detail))
    })

    /**
     * here i simulate a delay when fetching data from the
     * web service
     */
    //setTimeout(fetchAsync(), 3000)
}

/**
 * we install the event handler for the floatingButton component
 */
function installMenuEventHandler() {
    let menu = document.querySelector('#floatingButton')
    menu.addEventListener('onNew', (e) => {
        onNewEventHandler()
    })
    menu.addEventListener('onSend', (e) => {
        let id = myServiceComponent.generateGUID()
        alert(`will later be implemented to send data via REST: ${id}`)
    })
}

/**
 * here i will use the syntactic sugar of await
 * because of this i have to sign this function as async
 */
async function onNewEventHandler() {
    try {
        let geolocation = await myServiceComponent.getGeolocation()
        let nearestCities = await myServiceComponent.getNearestCities(geolocation)
        let weatherData = await myServiceComponent.getWeatherFromWOEID(nearestCities[0].woeid)
        let singleDayWeatherData = weatherData.consolidated_weather[0]
        //bundle the collected data to a new dataObject for local storage
        let dataObject = {
            Location: geolocation,
            Cities: nearestCities,
            WeatherData: singleDayWeatherData,
            ID: myServiceComponent.generateGUID()
        }
        myServiceComponent.stackNewDataObject(dataObject)
            .then( result => {
                //i can use this for displaying status infos in the gui
                //about the async storage operation
                console.dir(result)
            })
        stackNewUserCard (
            dataObject.Location, 
            dataObject.Cities, 
            dataObject.WeatherData,
            dataObject.ID
        )
    }
    catch( e ) {
        alert(`oops, something went wrong: ${e}`)        
    }
}

/**
 * inserts a new userCard object in front of the existing ones, so 
 * that they are always ordered descanding by time stamp 
 * @param {*} geolocation 
 * @param {*} nearestCities 
 * @param {*} singleDayData 
 */
function stackNewUserCard(geolocation, nearestCities, singleDayData, objectID) {
    let contentDiv = document.querySelector('#container')

    let formatOptions = {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }

    let nearestCity = nearestCities[0]
    let lat = geolocation.coords.latitude
    let long = geolocation.coords.longitude
    let googleMapHREF = `https://www.google.com/maps/place/${lat},${long}`

    let userCard = new UserCard()
    // set an id for the userCard
    userCard.Identifier = objectID
    userCard.Name = new Date(geolocation.timestamp).toLocaleString('de-DE', formatOptions) + ' Uhr'
    userCard.Image = myAppConfig.weatherIconBaseUrl + singleDayData.weather_state_abbr + '.svg'
    // now fill the slots with data
    let slots = userCard.shadowRoot.querySelectorAll('slot')
    slots.forEach(slot => {
        if (slot.name === 'email') slot.innerHTML = 
            `<a href="${googleMapHREF}">LAT: ${lat.toFixed(4)} LONG: ${long.toFixed(4)}</a>`
            //try href here like https://www.google.com/maps/place/52.4062,13.10386
        if (slot.name === 'phone') slot.innerText = 
            `Nearest City: ${nearestCity.title} (${Math.round(nearestCity.distance / 1000)} km)`
    })
    userCard.addEventListener('onSelectCard', (e) => myEventHandler(e.detail))
    contentDiv.insertBefore(userCard, contentDiv.firstChild)

}

/**
     * here we will fetch some data to insert new user-card elements on the
     * fly and via code
     * The random user web service is CORS ready. He is sending the
     * necessary HTTP Header 'Access-Control-Allow-Origin' with its
     * response.
     */
function fetchAsync() {
    let contentDiv = document.querySelector('#container')

    fetch('https://randomuser.me/api/?results=50')
        .then( response => response.json())
        .then( data => {
            /**
             * if we successfully fetched new items lets clear the results hashmap
             */
            results.clear()
            data.results.forEach( result => {
                /**
                 * let's use ES6 object deconstruction
                 * in some cases i will also assign new var names
                 */
                const { 
                    cell, 
                    email,
                    picture: {large: img},
                    login: {uuid: identifier},
                    name: {first: firstname},
                    name: {last: lastname},
                } = result
                //and lets add the new items 
                results.set(identifier, result)

                //creata a new instance of UserCard
                let userCard = new UserCard()
                // create a new attribute
                var nameAttribute = document.createAttribute("name");
                nameAttribute.value = firstname + " " + lastname
                var imgAttribute = document.createAttribute("avatar");
                imgAttribute.value = img
                var identifierAttribute = document.createAttribute("identifier")
                identifierAttribute.value = identifier
                //you can use attributes to set the data
                userCard.attributes.setNamedItem(nameAttribute)
                userCard.attributes.setNamedItem(imgAttribute)
                userCard.attributes.setNamedItem(identifierAttribute)
                //or you can use setter methods which are mapped to attributes 
                //see source of userCards.js
                //userCard.Name = firstname + " " + lastname
                //userCard.Image = img
                //we also need to fill the slots with data
                let slots = userCard.shadowRoot.querySelectorAll('slot')
                slots.forEach(slot => {
                    if (slot.name === 'email') slot.innerText = email
                    if (slot.name === 'phone') slot.innerText = cell
                })

                userCard.addEventListener('onSelectCard', (e) => myEventHandler(e.detail))
                contentDiv.appendChild(userCard)
            })

        }) 
}

export { init }