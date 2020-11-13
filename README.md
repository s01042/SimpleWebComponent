# My thoughts about Web Components
My first thought about web components is, they will help me to structure my source code. I can split the functionality in meaningful and separated parts (encapsulation), for example service components, business objects and view components. I can assemble my GUI from view components and wire them up via events and event handler. 

Web components **do not require any special 3rd party libraries or frameworks** but can certainly be used with them (eg. with Angular, Vue and React). 

Web components are based on web standards and will never become obsolete. Web components are reusable.

# What are Web Components?
Web components are a set of web platform APIs that allow us to create custom, reusable and encapsulated HTML tags to use in web pages and web apps.

# The building blocks of Web Components
## custom elements
* create new custom html tags
* extend existing html tags
* create a custom class with Javascript / Typescript which extends HTMLElement
* lifecycle methods are available to hook up to certain events
## shadow dom
* encapsulates the DOM for example to avoid side effects of css and events between the component and the html document that is hosting this component
* used for self-contained components
## html templates
* defines the encapsulated markup of the web component
* at runtime the template tag will be replaced with the actual mark up of the template
includes both html and css 
* uses slots to add custom text

# About this example
I built my simple web component with plain vanilla Javascript. It is really nothing special but it shows the basic structure of a web component.

I used html attributes to 'transfer' data to the component. I used 'encapsulated' css to style the component. I used eventhandlers to establish interaction with the component. I used a simple callback to establish an interaction between the component and the page, that is hosting the web component.

First I inserted the new custom html tag in my html page. That is the declarative way to use a web component. Take a look at the attributes, that are used to hand over data to the web component. Then i used the concept of **slots** to hand over some more data to the web component. After that i also consumed a simple web service and add even more instances of the userCard component at runtime. For this i again use some simple Javascript.

There is also a simple callback established. So the web component can call back a function of the page, that is hosting the component and can for instance return data. Keep in mind, that you can not only send simple data types but of course objects as well.  

Finally take a quick look at the custom css property in index.html 

>--theme-colour: darkgrey;

Custom css properties will **always** "reach" the web component. This is a way to style a web component from outside.

# Whats next?
In this example I only scratched on the surface of web components. There is a lot more to be discovered, for example event bubbling, nesting web components and wire them up with events and event handlers. 

There is a growing number of ready to use web components and there are frameworks that eases to build web components. [This](https://www.polymer-project.org/) is a good starting point to learn more.

# Try out the example web component
Use this [link](https://s01042.github.io/SimpleWebComponent/) to go to github pages, where a little demo is hosted.

# Todo

Make it drag and drop ready, espacially for mobile devices. Read [here](https://justinribeiro.com/chronicle/2020/07/14/handling-web-components-and-drag-and-drop-with-event.composedpath/) and [here](https://web.dev/drag-and-drop/)

add a short message field (SMF) to add/edit some additional informations per entry. 
implement to delete entries
refactore gapi load and gapi init (load and init only when needed, eg when data should be send)

# Remarks

For local DEV environment i installed a CORS Proxy.
``` cmd
cd \My Library\DEV\cors-anywhere
node .\server.js
```
