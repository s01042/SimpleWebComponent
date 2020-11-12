const template = document.createElement('template')

template.innerHTML = `
    <style>

        * {
            outline: none;
        }

        #menu-btn {
            z-index: 1;
            cursor: pointer;
        }

        .close {
            animation: animation 0.5s;
        }
        .close .btn-line:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        .close .btn-line:nth-child(2) {
            opacity: 0;
        }
        .close .btn-line:nth-child(3) {
            transform: rotate(-45deg) translate(6px, -6px);
        }

        @keyframes animation {
            from {transform: rotate(0deg)}
            to {transform: rotate(180deg)}
        }

        @keyframes slidein {
            0%  {right: -200px}
            100% {right: 2vw}
        }
        
        @keyframes slideout {
            0%  {top: -40px}
            25% {top: 0px}
            50% {top: 50px}
            75% {top: 100px}
            100% {top: 200px}
        }

        .btn-line {
            width: 28px;
            height: 3px;
            margin: 0 0 5px 0;
            background: #525050;
        }
        
        #container {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 21rem;
            width: 8rem;
            fontsize: 1em;
            /* background: yellow; */
            z-index: 1;
        }

        #menu-btn {
            display: inline-block;
            position: absolute;
            bottom: 0;
        }

        #hiddenContainer {
            display: none;
            flex-direction: column;
            /* position: absolute; */
            align-items: center;
            /* background: red; */
        }

        #hiddenContainer.slidein {
            animation-name: slidein;
            animation-duration: 500ms;
        }

        #hiddenContainer.slideout {
            animation-name: slideout;
            animation-duration: 1000ms;
        }

        #hiddenContainer button {
            cursor: pointer;
            background: #525050;
            color: #fff;
            width: 5rem;
            height: 5rem;
            /* font-size: 1rem; */
            border-radius: 50%;
            margin-top: 10px;
            border: none;
        }
    </style>

    <div id='container'>
        <div id='hiddenContainer'>
            <button id='recordNew'>New</button>
            <button id='sendData'>Send</button>
            <button id='appConfig'>Config</button>
        </div>
        <div id='menu-btn'>
            <div class='btn-line'></div>           
            <div class='btn-line'></div>           
            <div class='btn-line'></div>           
        </div>
    </div>
    
`
/**
 * this is a floating button menu for my plannend 
 * mobile phone app. it will stay always on top in 
 * the right corner of the screen so it is easy to 
 * reach with the thumb of the right hand.
 * the menu button is pure css. take a look at btn-line for example
 * the rotation animation is simple css translate but then
 * there is the interessting part where single lines (nth-child)
 * will be rotated and translated so they form an X in the end.
 */
export default class FloatingButton extends HTMLElement {

    
    constructor() {
        super()

        this.menuOpen = false

        this.attachShadow( {mode: 'open'})
        this.shadowRoot.appendChild(template.content.cloneNode(true))

        /**
         * here we declare custom events for this new component
         * we will fire this custom events from our component when the
         * corresponding buttons are pressed
         * others can bind to this events and react accordingly
         */
        this.onNewClicked = new CustomEvent('onNew', {
            bubbles: true,
            cancelable: false,
        })
        this.onSendClicked = new CustomEvent('onSend', {
            bubbles: true,
            cancelable: false,
        })
        this.onAppConfigClicked = new CustomEvent('onAppConfig', {
            bubbles: true,
            cancelable: false,
        })
    }

    /**
     * 
     */
    connectedCallback() {
        this.shadowRoot.querySelector('#menu-btn').addEventListener('click', (e) => {
            this.toggleMenu()
        })
        this.shadowRoot.querySelector('#recordNew').addEventListener('click', (e) =>{
            this.dispatchEvent(this.onNewClicked)
        })
        this.shadowRoot.querySelector('#sendData').addEventListener('click', (e) =>{
            this.dispatchEvent(this.onSendClicked)
        })
        this.shadowRoot.querySelector('#appConfig').addEventListener('click', (e) => {
            this.dispatchEvent(this.onAppConfigClicked)
        })
    }


    toggleMenu() {
        this.menuOpen = !this.menuOpen
        let menuButton = this.shadowRoot.querySelector('#menu-btn')
        let hiddenContainer = this.shadowRoot.querySelector('#hiddenContainer')
    
        if (this.menuOpen) {           
            menuButton.classList.add('close')
            hiddenContainer.className = 'slidein'
            hiddenContainer.style.display = 'flex'

        } else {
            menuButton.classList.remove('close')
            hiddenContainer.className = 'slideout'
            setTimeout((e) => {hiddenContainer.style.display= 'none'}, 100)
        }
    }

}

window.customElements.define('floating-button', FloatingButton)