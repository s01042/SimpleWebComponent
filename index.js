
/**
 * a simple callback function which i will bind 
 * on the web component
 * @param {*} data 
 */
function myCallbackFunction(elementKey) {
    const selectedElement = results.get(elementKey)
    alert(`handled as callback in index.js with ID data: ${selectedElement}`)
}

let results = new Map()

function init() {
    /**
     * here we iterate over the declarative inserted user-card components and use 
     * the public method setCallback of these components to
     * register the simple callback from above
     */
    let userCards = document.querySelectorAll('user-card')
    userCards.forEach( userCard => {
        userCard.setCallback(myCallbackFunction)
    })

    setTimeout(fetchAsync(), 3000)
 
}

/**
     * then we will fetch some data to insert new user-card elements on the
     * fly and via code
     */
function fetchAsync() {
    let contentDiv = document.querySelector('#container')

    fetch('https://randomuser.me/api/?results=50')
        .then( response => response.json())
        .then( data => {
            /**
             * if we successfully fetched new items lets clear the result hashmap
             */
            results.clear()
            data.results.forEach( result => {
                let phone = result.cell
                let email = result.email
                let name = result.name.first + ' ' + result.name.last
                let img = result.picture.large
                let identifier = result.login.uuid
                //and lets then add the new items 
                results.set(identifier, result)

                //creata a new instance of UserCard
                let userCard = new UserCard()
                //create a new attribute
                var nameAttribute = document.createAttribute("name");
                nameAttribute.value = name
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
                //userCard.Name = name
                //userCard.Image = img
                //we also need to fill the slots with data
                let slots = userCard.shadowRoot.querySelectorAll('slot')
                slots.forEach(slot => {
                    if (slot.name === 'email') slot.innerText = email
                    if (slot.name === 'phone') slot.innerText = phone
                })

                userCard.setCallback(myCallbackFunction)
                contentDiv.appendChild(userCard)
            })

        }) 
}