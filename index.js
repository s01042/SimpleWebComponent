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

const myAppConfig = new AppConfig(true) //runs in DEV environment?
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
                let textToDisplay = new Date(selectedElement.WeatherData.created).
                    toLocaleTimeString("de-DE",  
                        {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }
                    ) + " Uhr"
                const dialog = document.getElementById("dialog")
                const closeButton = dialog.querySelector('sl-button[slot="footer"]')
                closeButton.addEventListener ('click', () => {dialog.hide()})
                dialog.label = 'Timestamp of weather data'
                document.getElementById("content").innerHTML = `captured by weather station on: '${textToDisplay}'`
                dialog.show()
                // alert(`weather data created: '${textToDisplay.toLocaleString()}'`)
            } else {
                alert(`no more data available for item with id '${elementKey}'`)
            }        
        })
}


function init() {
    installMenuEventHandler()
    myServiceComponent.getLocallyStoredData().then( dataMap => {
        //todo iterate over the map and build card components dynamically
        dataMap.forEach( item => {
            stackNewUserCard (
                item.Location,
                item.City,
                item.WeatherData,
                item.ID,
                false
            )
        })
    })

    /**
     * here we iterate over the declarative inserted user-card components and 
     * bind the event handler for selecting a card
     */
    let userCards = document.querySelectorAll('user-card')
    userCards.forEach( userCard => {
        userCard.addEventListener('onSelectCard', (e) => myEventHandler(e.detail))
    })
}


// Always escape HTML for text arguments!
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}  

// Custom function to emit toast notifications (shoelace alert web component)
function notify(message, type = 'primary', icon = 'info-circle', duration = 3000) {
    const alert = Object.assign(document.createElement('sl-alert'), {
        type: type,
        closable: true,
        duration: duration,
        innerHTML: `
        <sl-icon name="${icon}" slot="icon"></sl-icon>
        ${escapeHtml(message)}
        `
    });

    document.body.append(alert);
    return alert.toast();
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
        myServiceComponent.sendData()
            .then (file => {
                notify (`successfully saved your data on Google Drive`, 'info', 'check2-circle', 5000)
            }) 
            .catch (error => {
                notify (`${error.message}`, 'warning', 'exclamation-triangle', 5000)
            })               
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
            City: nearestCities[0],
            WeatherData: singleDayWeatherData,
            ID: myServiceComponent.generateGUID()
        }
        myServiceComponent.stackNewDataObject(dataObject)
            .then( result => {
                //i can use this for displaying status infos in the gui
                //about the async storage operation
                if (myServiceComponent.persistDataLocally(result)) {
                    console.dir(result)
                } 
            })
        stackNewUserCard (
            dataObject.Location, 
            dataObject.City, 
            dataObject.WeatherData,
            dataObject.ID,
            true
        )
        //todo: notify?
    }
    catch( e ) {
        // alert(`oops, something went wrong: ${e}`)        
        notify (`oops, something went wrong: '${e.message}'`, 'warning', 'exclamation-triangle', 4000)
    }
}

/**
 * stack a userCard object 
 * if onTop is true stack it on the first place, else append it
 * @param {*} geolocation 
 * @param {*} nearestCities 
 * @param {*} singleDayData 
 */
function stackNewUserCard(geolocation, nearestCity, singleDayData, objectID, onTop= false) {
    let contentDiv = document.querySelector('#container')

    let formatOptions = {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }

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
        if (slot.name === 'position') slot.innerHTML = 
            `<a href="${googleMapHREF}">LAT: ${lat.toFixed(4)} LONG: ${long.toFixed(4)}</a>`
            //try href here like https://www.google.com/maps/place/52.4062,13.10386
        if (slot.name === 'city') slot.innerText = 
            `Nearest City: ${nearestCity.title} (${Math.round(nearestCity.distance / 1000)} km)`
        if (slot.name === 'temperature') slot.innerText = 
            `Temperature: ${Math.round(singleDayData.the_temp)} °C`
    })
    userCard.addEventListener('onSelectCard', (e) => myEventHandler(e.detail))
    if (onTop) {
        contentDiv.insertBefore(userCard, contentDiv.firstChild)
        contentDiv.firstChild.scrollIntoView(false)
        userCard.blink()
    } else {
        userCard.toggleInfo()
        contentDiv.appendChild(userCard)
    }

}


export { init }