/**
 * I use ES6 modules here.
 */

import UserCard from './components/userCard.js'

/**
 * this is a simple event handler that i bind to the 
 * custom event of the userCard component
 * @param {*} data 
 */
function myEventHandler(elementKey) {
    const selectedElement = results.get(elementKey)
    if (selectedElement) {
        alert(`eventhandler in index.js with ID data '${elementKey}'. this is '${selectedElement.email}'`)
    } else {
        alert(`no more data available for this item`)
    }
    
}

let results = new Map()

function init() {
    installMenuEventHandler()
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
    setTimeout(fetchAsync(), 3000)
}

/**
 * we install the event handler for the floatingButton component
 */
function installMenuEventHandler() {
    let menu = document.querySelector('#floatingButton')
    menu.addEventListener('onNew', (e) =>{
        alert(`connect your event handler for 'onNew' Event`)
    })
    menu.addEventListener('onSend', (e =>{
        alert(`connect your event handler for 'onSend' Event`)
    }))
}

/**
     * here we will fetch some data to insert new user-card elements on the
     * fly and via code
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

export { init, results }