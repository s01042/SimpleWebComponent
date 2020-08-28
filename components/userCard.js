/**
 * I switched to ES6 modules. With modules it's easier to split 
 * source code into multiple files. Each js-file is a module. 
 * A module can export classes, a library of functions, constants,
 * vars, etc.
 * A module is just a file. One js source file is one module.
 * Modules can load each other and interchange functionality 
 * via import and export statements.
 * The userCard module for example only exports the UserCard class.
 * Every module that wants to use the UserCard must import this class
 * from here. (see index.js and index.html)
 * 
 * I'm using a template for my web component 
 * 
 * todo: add a visual representation for new userCard objects 
 * eg. some flash of the background color
 * 
 */
const template = document.createElement('template')

/**
 * with encapsulated css styles
 * this is a template literal
 * 
 * must media queries always follow the standard css declarations?
 * in other words is the order significant?
 */
template.innerHTML = `
    <style>
        .user-card h2 {
            color: #1d405c;
            cursor: pointer;
            size: 2em
        }

        .user-card {
  
            width: 500px;
            height: 200px;
            font-family: 'Arial', sans-serif;
            background: #6d7d8a;            
            display: grid;
            grid-template-columns: 1fr 2fr;
            grid-gap: 10px;
            margin-bottom: 15px;
            border-bottom: #a6a6a6 3px solid;
            border-right: #a6a6a6 2px solid;
            padding-top: 0.2em;
            padding-left: 1em;
            border-radius: 1em;
            cursor: move;
        }
        .user-card img {
            border-radius: 50%;
            max-width: 80%;
            height: auto;
            padding-top: 1em;            
        }
        .user-card button {
            cursor: pointer;
            background: #525050;
            color: #fff;
            border: 0;
            border-radius: 5px;
            padding-top: 5px;
            padding-rigth: 20px;
        }
        .user-card p {
            line-height: 0.7;
            color: white;
        }
        .user-card a {
            color: #eb9b13;
            text-decoration: none;
        }

        /*
        @media only screen and (max-width: 1100px) {
            .user-card {
              height: 300px;
              width: 700px
            }
        }
        */

    </style>
    
    <div class='user-card' draggable='true'>
        <img />
        <div>
            <h2></h2>
            <div class='info'>
                <p><slot name='position' /></p>
                <p><slot name='city' /></p>
                <p><slot name='temperature' /></p>
            </div>
            <button id='toggleInfo'>hide info</button>
        </div>
    </div>
`

/**
 * here is the corresponding class that extends HTMLElement
 */
export default class UserCard extends HTMLElement {
    constructor() {
        super()

        this.showInfo = true;       //this is a state var of my component
        this.id = null;             //will be used in callback to notify about 
                                    //the selection of a card
        this.eventName = 'onSelectCard';

        /**
         * preparing drag and drop support
         */
        this.addEventListener("dragstart", this.__dragStart.bind(this));
        this.addEventListener("dragend", this.__dragEnd.bind(this));

        /**
         * without shadow dom the styles from the document 
         * and the styles from this component would affect each other
         */
        this.attachShadow({ mode: 'open' })
        //here we appending the template on then freshly opened shadowroot
        this.shadowRoot.appendChild(template.content.cloneNode(true))
        //attribute are a way to 'send' data to the web component
        //see index.html
        this.shadowRoot.querySelector('h2').innerText = this.getAttribute('name')
        this.shadowRoot.querySelector('img').src = this.getAttribute('avatar')
        this.id = this.getAttribute('identifier')
    }

    __dragStart () {
        console.log (`drag start for item ${this.id}`)
        this.style.opacity = '0.4'
    }

    __dragEnd () {
        console.log (`drag end for item ${this.id}`)
        this.style.opacity = '1.0'
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
     * i switched to customEvents to inform the host about 
     * the selection of a userCard
     */
    onSelect() {        
        let event = new CustomEvent(this.eventName, {detail: this.id})
        this.dispatchEvent(event)
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
     * this is a component lifecycle method which is called 
     * when the component is connected to the dom of the hosting page
     * here we simply add event listeners to the button and the h3
     */
    connectedCallback() {
        this.shadowRoot.querySelector('#toggleInfo').addEventListener('click', (e) => {
            this.toggleInfo()
        })
        this.shadowRoot.querySelector('h2').addEventListener('click', (e) => {
           this.onSelect()
        })
    }

    /**
     * this is a component lifecycla method
     * when the component is disconnected from the dom we will
     * remove our event handlers
     */
    disconnectedCallback() {
        this.shadowRoot.querySelector('#toggleInfo').removeEventListener('click')
        this.shadowRoot.querySelector('h2').removeEventListener('click')
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
                this.shadowRoot.querySelector('h2').innerText = newValue
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

