/**
 * I'm using a template for my web component 
 */
const template = document.createElement('template')

/**
 * with encapsulated css styles
 */
template.innerHTML = `
    <style>
        h3 {
            color: darkgrey;
            cursor: pointer;
        }

        .user-card {
            font-family: 'Arial', sans-serif;
            background: #f4f4f4;
            width: 400px;
            height: 170px;
            display: grid;
            grid-template-columns: 1fr 2fr;
            grid-gap: 10px;
            margin-bottom: 15px;
            border-bottom: var(--theme-colour) 5px solid;
        }
        .user-card img {
            border-radius: 50%;
            max-width: 100%;
            height: auto;            
        }
        .user-card button {
            cursor: pointer;
            background: var(--theme-colour);
            color: #fff;
            border: 0;
            border-radius: 5px;
            padding-top: 5px;
            padding-rigth: 20px;
        }

    </style>
    
    <div class='user-card'>
        <img />
        <div>
            <h3></h3>
            <div class='info'>
                <p><slot name='email' /></p>
                <p><slot name='phone' /></p>
            </div>
            <button id='toggleInfo'>hide info</button>
        </div>
    </div>
`

/**
 * here is the corresponding class that extend HTMLElement
 */
class UserCard extends HTMLElement {
    constructor() {
        super()

        this.showInfo = true;       //this is a state var of my component
        this.callback = null;       //here we will store a ref to a callback func.
        this.id = null;             //will be used in callback to notify about 
                                    //the selection of a card

        /**
         * without shadow dom the styles from the document 
         * and the styles from this component would affect each other
         */

        this.attachShadow({ mode: 'open' })
        //here we appending the template on then freshly open shadowroot
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        //attribute are a way to 'send' data to the web component
        //see index.html
        this.shadowRoot.querySelector('h3').innerText = this.getAttribute('name')
        this.shadowRoot.querySelector('img').src = this.getAttribute('avatar')
        this.id = this.getAttribute('identifier')
    }

    /**
     * a simple method to toggle the display 
     */
    toggleInfo() {
        this.showInfo = !this.showInfo
        const info = this.shadowRoot.querySelector('.info')
        const button = this.shadowRoot.querySelector('#toggleInfo')

        if (this.showInfo) {
            info.style.display = 'block'
            button.innerText = 'hide info'
        } else {
            info.style.display = 'none'
            button.innerText = 'show info'
        }
    }

    /**
     * this is a public function to set a callback function
     * here it is only for testing reasons 
     * @param {callbackFuntion} callbackFuntion 
     */
    setCallback(callbackFuntion) {
        this.callback = callbackFuntion
    }

    /**
     * here i call the callback function if one is available
     * @param {stringData} data 
     */
    callbackHost(data) {
        if (this.callback) {
            this.callback(this.id)
        }
    }

    /**
     * this are getter and setter functions
     * the values are mapped on the correspoding attributes
     * if i want to use my web component in javascipt code i can then
     * simply set the values instead of using html attributes
     * see index.js for example
     */
    get Name() {
        return this.getAttribute('name')
    }

    set Name(newValue) {
        this.setAttribute('name', newValue)
    }

    get Image() {
        return this.getAttribute('avatar')
    }

    set Image(newImage) {
        this.setAttribute('avatar', newImage)
    }

    get Identifier() {
        return this.getAttribute('identifier')
    }

    set Identifier(newValue) {
        this.setAttribute('identifier', newValue)
    }

    /**
     * this is a component lifecycle massage which is called 
     * when the component is connected to the dom of the hosting page
     * here we simply add event listeners to the button and the h3
     */
    connectedCallback() {
        this.shadowRoot.querySelector('#toggleInfo').addEventListener('click', (e) => {
            this.toggleInfo()
        })
        this.shadowRoot.querySelector('h3').addEventListener('click', (e) => {
            this.callbackHost(this.shadowRoot.querySelector('h3'))
        })
    }

    /**
     * this is a component lifecycla message
     * when the component is disconnected from the dom we will
     * remove our event handlers
     */
    disconnectedCallback() {
        this.shadowRoot.querySelector('#toggleInfo').removeEventListener('click')
        this.shadowRoot.querySelector('h3').removeEventListener('click')
    }

    /**
     * this is a static method of HTMLElement
     * here you can define the attributes for which you will 
     * observe changes of their values
     */
    static get observedAttributes() {
        return ['name', 'avatar', 'identifier']
    }

    /**
     * this is a method of HTMLElement which will be called
     * every time an observed attribute will change
     * @param {*} name 
     * @param {*} oldValue 
     * @param {*} newValue 
     */
    attributeChangedCallback(name, oldValue, newValue) {
        //console.log(`attribute changed ${name} with new value ${newValue}`)
        switch (name) {
            case 'name':
                this.shadowRoot.querySelector('h3').innerText = newValue
                break;
            case 'avatar':
                this.shadowRoot.querySelector('img ').src = newValue
                break;
            case 'identifier':
                this.id = newValue
                break    
        }
    }
}

/**
 * finaly we bind the web component to the custom html tag user-card
 * the name of the custom element must have a dash in it
 */
window.customElements.define('user-card', UserCard)