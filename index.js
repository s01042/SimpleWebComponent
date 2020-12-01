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

const myAppConfig = new AppConfig(false) //runs in DEV environment?
const myServiceComponent = new ServiceComponent(myAppConfig)
let progressDialog = null

/**
 * trigger to register the service worker 
 */
window.addEventListener ('load', () => {
    registerServiceWorker ()
})

/**
 * register serviceWorker
 * the serviceWorker location is important because it defines its scope
 * another important point: a ServiceWorker location has to be https hosted
 * localhost of course will also work
 */
async function registerServiceWorker () {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register ('./service-worker.js', { scope: "/SimpleWebComponent/" })
        } catch (exception) {
            notify (`ServiceWorker registration failed: ${exception}`, 'warning', 'exclamation-triangle', 50000)
        }
    } else {
        notify (`your browser does not support ServiceWorker.`)
    }
}

/**
 * this is a simple event handler binded to the 
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
            }        
        })
}

/**
 * event handler for small messages
 * @param {*} elementKey 
 */
function smsEventHandler (elementKey) {
    let selectedElement = null
    let cm = null
    myServiceComponent.getLocallyStoredData ()
        .then (map => {
            cm = map
            selectedElement = cm.get (elementKey)
            if (selectedElement) {
                let dialogCaption = "SMS for \'" + new Date (selectedElement.Location.timestamp)
                .toLocaleTimeString ("de-DE",
                    {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }
                ) + " Uhr'"

                let textToDisplay = selectedElement.SMS ? selectedElement.SMS : ""
                const dialog = document.getElementById ("smsDialog")
                dialog.label = dialogCaption
                const saveButton = dialog.querySelector ('sl-button[type="info"]')
                const cancelButton = dialog.querySelector('sl-button[type="secondary"]')
                const textArea = document.getElementById('message-text')
                textArea.value = textToDisplay
                cancelButton.addEventListener ('click', (e) => {
                    dialog.hide()
                })
                saveButton.addEventListener ('click', (e) => {
                    // console.log (`sms to save: ${textArea.value}`)
                    selectedElement.SMS = textArea.value
                    cm.set (selectedElement.ID, selectedElement)
                    myServiceComponent.persistDataLocally (cm)
                    dialog.hide()
                })
                dialog.show ()
            }
        })
}

/**
 * the init routine to wire up event handlers and to load and display locally stored data 
 */
function init() {
    installMenuEventHandler()
    myServiceComponent.addEventListener ('onSignedInStatusChanged', (e) => {
        notify (`signed in state changed to '${e.detail}'`, 'info', 'check2-circle')
    })
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
        updateBadge (dataMap.size)
    })

}

/**
 * update the badge on top of the screen with the actual number of data entries
 * @param {*} newValueToDisplay 
 */
function updateBadge (newValueToDisplay) {
    const badge = document.querySelector ('sl-badge[type="info"]')
    badge.innerText = newValueToDisplay
}

/**
 * to delete an existing entry means
 * remove the the web component from the dom
 * remove the data entry from the data collection
 * persist the updated data 
 * @param {*} eventDetails 
 */
function handleOnDeleteCard (entryID) {
    myServiceComponent.getLocallyStoredData()
        .then (map => {
            let selectedElement = map.get (entryID)
            if (selectedElement) {
                let textToDisplay = new Date (selectedElement.Location.timestamp)
                    .toLocaleTimeString ("de-DE",
                        {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }
                    ) + " Uhr"
                const confirmationDialog = document.getElementById ('deleteConfirmation')
                const yesButton = confirmationDialog.querySelector ('sl-button[type="info"]')
                const noButton = confirmationDialog.querySelector ('sl-button[type="secondary"]')
                noButton.addEventListener ('click', () => {confirmationDialog.hide()})
                yesButton.addEventListener ('click', () => {
                    confirmationDialog.hide()
                    const contentDiv = document.getElementById('container')
                    let userCard = contentDiv.querySelector (`user-card[id="${entryID}"]`)
                    if (userCard != null) {
                        contentDiv.removeChild (userCard)
                        map.delete (entryID)
                        if (myServiceComponent.persistDataLocally (map)) {
                            notify (`entry with time stamp '${textToDisplay}' deleted`)
                            updateBadge (map.size)
                        }
                        else {
                            notify (`something went wrong`, 'warning', 'exclamation-triangle', 5000)
                        }                            
                                
                    }
                })
                document.getElementById ('confirmationMessage').innerHTML = `are you sure you want to delete the item with time stamp <br><h2>'${textToDisplay}'</h2>`
                confirmationDialog.show()            
            }
        })
}


// Always escape HTML for text arguments!
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}  

// Custom function to emit toast notifications (shoelace alert web component)
// keep in mind: the toast method will completely remove (delete) the dialog from the dom tree on disposal 
function notify(message, type = 'primary', icon = 'info-circle', duration = 3000) {
    const alert = Object.assign(document.createElement('sl-alert'), {
        type: type,
        closable: true,
        duration: duration,
        innerHTML: `
        <sl-icon name="${icon}" slot="icon"></sl-icon>
        ${escapeHtml(message)}
        `
    })

    document.body.append(alert)
    return alert.toast()
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
        toggleMenu ()
        /**
         * we only login when necessary and in response to the request of send data
         * we want to be prepared for offline usage as long as possible
         */
        myServiceComponent.loginWithGoogle ()
            .then (basicProfile => {
                myServiceComponent.postDataToGoogleDrive ()
                    .then (file => {
                        notify (`successfully saved data on Google Drive for user '${basicProfile.getName()}'`, 'info', 'check2-circle', 5000)
                    })
                    .catch (error => {
                        notify (`${error.message}`, 'warning', 'exclamation-triangle', 5000)
                    })
            })
    })
    menu.addEventListener('onAppConfig', editAppConfig)
}

/**
 * toggle the floatingButton menu
 */
function toggleMenu () {
    let container = document.getElementById ('floatingButton')
    let floatingButton = Object.assign (container.firstElementChild)
    floatingButton.toggleMenu ()
}

function storageUsage () {
    navigator.storage.estimate().then(function(estimate) {
  
        console.log (`estimate usage: ${estimate.usage}`)
        console.log (`estimate quota: ${estimate.quota / 1024 / 1024}`)
  })
}

/**
 * edit App Config
 */
function editAppConfig() {
    toggleMenu ()
    storageUsage ()
    const configDialog = document.getElementById('config')
    const saveButton = configDialog.querySelector('sl-button[type="info"]')
    const cancelButton = configDialog.querySelector('sl-button[type="secondary"]')
    const apiKey = configDialog.querySelector('sl-input[name="apikey"]')
    apiKey.value = myAppConfig.ApiKey
    const clientID = configDialog.querySelector('sl-input[name="clientid"]')
    clientID.value = myAppConfig.ClientID
    const fileID = configDialog.querySelector('sl-input[name="fileid"]')
    fileID.value = myAppConfig.FileID
    saveButton.addEventListener ('click', () => {
        configDialog.hide()
        myAppConfig.ApiKey = apiKey.value
        myAppConfig.ClientID = clientID.value
        myServiceComponent.updateAppConfig()
        notify (`App Config saved`, 'info', 'check2-circle', 5000)
    })
    cancelButton.addEventListener ('click', () => {
        configDialog.hide()
    })
    configDialog.show()

}

function toggleProgressDialog () {
    progressDialog = Object.assign (document.getElementById ('progress'))
    progressDialog.open ? progressDialog.hide () : progressDialog.show ()
}

function updateProgressDialog (percentage, labelText) {
    const progressBar = document.querySelector ('.progress-bar-labels')
    progressBar.percentage = percentage
    progressBar.textContent = labelText
}

/**
 * here i will use the syntactic sugar of await
 * 
 * things to keep in mind:
 *      will getGelocation works, if i'm offline? (yes)
 *      the web service calls will not work, if i'm offline
 */
async function onNewEventHandler() {
    toggleMenu ()
    // init objects with null
    let nearestCities = null
    let weatherData = null
    let singleDayWeatherData = null
    let geolocation = null
    toggleProgressDialog ()
    try {
        /** getGeolocation should work in offline mode */
        updateProgressDialog ("30", "fetching geolocation")
        geolocation = await myServiceComponent.getGeolocation()
        /**
         * web service calls are only possible if we are online
         * but can go wrong even if online 
         * the catch handler will be used in this cases
         */
        if (navigator.onLine) {
            updateProgressDialog ("60", "fetching City")
            nearestCities = await myServiceComponent.getNearestCities(geolocation)
            updateProgressDialog ("90", "fetching weather data")
            weatherData = await myServiceComponent.getWeatherFromWOEID(nearestCities[0].woeid)    
            singleDayWeatherData = weatherData ? weatherData.consolidated_weather[0] : null
        } 
    /**
     * if the catch handler will be called something went wrong 
     * we will notify the user
     */
    }
    catch( e ) {
        if (e.constructor.name === "GeolocationPositionError") {
            notify (`GeolocationPositionError: '${e.message}'`, 'warning', 'exclamation-triangle', 50000)    
        } else {
            notify (`oops, something went wrong: '${e.message}'`, 'warning', 'exclamation-triangle', 50000)
        }
    }
    /**
     * if at least geolocation is not null, we will store a new entry
     */
    if (geolocation) {
        updateProgressDialog ("100", "save data locally")
        //bundle the collected data to a new dataObject for local storage
        let dataObject = {
            Location: geolocation,
            City: (nearestCities) ? nearestCities[0] : null,
            WeatherData: singleDayWeatherData,
            ID: myServiceComponent.generateGUID(),
            SMS: ""
        }
        /**
         * stack it in front of all the existing entries in local storage
         */
        myServiceComponent.stackNewDataObject(dataObject)
            .then( result => {
                //i can use this for displaying status infos in the gui
                //about the async storage operation
                if (myServiceComponent.persistDataLocally(result)) {
                    notify (`'${result.size}' elements in collection`, 'info', 'check2-circle')
                    updateBadge (result.size)
                } 
            })
        /**
         * stack it in front of all the existing userCards in the GUI:
         * the most recent first
         */
        stackNewUserCard (
            dataObject.Location, 
            dataObject.City, 
            dataObject.WeatherData,
            dataObject.ID,
            true
        )    
    }
    // reset progress dialog
    updateProgressDialog ("0", "")
    toggleProgressDialog ()
}

/**
 * stack a userCard object 
 * if onTop is true stack it on the first place, else append it
 * @param {*} geolocation 
 * @param {*} nearestCities 
 * @param {*} singleDayData 
 */
function stackNewUserCard(geolocation, nearestCity, singleDayData, objectID, onTop= false) {
    try {

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
        if (singleDayData) {
            userCard.Image = myAppConfig.weatherIconBaseUrl + singleDayData.weather_state_abbr + '.svg'
        } else {
            userCard.Image = './images/hc.svg'
        }
        // now fill the slots with data
        let slots = userCard.shadowRoot.querySelectorAll('slot')
        slots.forEach(slot => {
            if (slot.name === 'position') slot.innerHTML = 
                `<a href="${googleMapHREF}">LAT: ${lat.toFixed(4)} LONG: ${long.toFixed(4)}</a>`
                //try href here like https://www.google.com/maps/place/52.4062,13.10386
            if (slot.name === 'city') slot.innerText = 
                (nearestCity != null)?
                    `Nearest City: ${nearestCity.title} (${Math.round(nearestCity.distance / 1000)} km)` :
                    `Nearest City: 'n.a. (offline)'`
            if (slot.name === 'temperature') slot.innerText = 
                (singleDayData != null) ?
                    `Temperature: ${Math.round(singleDayData.the_temp)} °C` :
                    `Temperature: 'n.a. (offline)`
        })
        userCard.addEventListener('onSelectCard', (e) => smsEventHandler(e.detail))
        userCard.addEventListener('onDeleteCard', (e) => handleOnDeleteCard(e.detail))
        if (onTop) {
            contentDiv.insertBefore(userCard, contentDiv.firstChild)
            contentDiv.firstChild.scrollIntoView(false)
            userCard.blink()
        } else {
            // userCard.toggleInfo()
            contentDiv.appendChild(userCard)
        }
    } catch (e) {
        console.log (`oops ... something went wrong: ${e.message}`)
    }

}


export { init }