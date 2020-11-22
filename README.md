# My thoughts about Web Components
I'm a little bit tired of all the JavaScript frameworks. There are a bunch of them e.g. React, React Native, Vue, Angular, Svelte. It's not easy to prefer one framework over the many others. It's hard to choose and then sometimes there will be a steep learning curve, a heavy investment of time and willpower to learn and understand at least the basics and core principals of such a framework. I'm not a big fan of copy & paste implementation although I do that too sometimes. I like to understand what's going on in my source code. But my spare time is limited and so i shied away from a decision many times.

And then these frameworks comes and goes on a regular basis. So it is very easy for investments to be lost.

But for me something changed with the rising of web components.

Web components **do not require any special 3rd party libraries or frameworks** but can certainly be used with them (eg. with Angular, Vue and React). 

Web components are **based on web standards and will never become obsolete**. Web components are reusable. For me these are reasons enough to take a closer look on web components and try them out in a so called **Fingerübung** (a german word for "finger exercise")

Web components will help me to structure my source code. I can split the functionality in meaningful and separated parts (encapsulation), for example service components, business objects and view components. I can assemble my GUI from view components and wire them up via events and event handlers. I can use data binding to connect gui components with business objects.

Sounds promising. Let's make an investment. I will challenge myself again to see what i can put together. 


# What are Web Components?
Web components are a set of web platform APIs that allow to create custom, reusable and encapsulated HTML tags to use in web pages and web apps.

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
* includes both html and css 
* uses slots to add custom text

# About this example
This is a coding exercise, my first hands on approach to web components. My steps are: read, try, fail, read again, try again, understand, implement. We are, what we are doing. 

Learning is fun but to maximize the pleasure i wanted to build something of personal use. I wanted to take it even further and mix and combine this with the idea of a progressive, single page web app. For single page apps the concept of an app shell is feasible. This approach relies on aggressively caching the static elements of the app shell by using a service worker to get the application running even when without a network connection. 

The target device of this PWA is my mobile phone, a Huawei P20 Pro. So I did not yet invest time in implementing a responsive layout, neither in my own web components nor in the app shell.

When on travel, i want to collect geolocation data, enrich them with weather data of my actual location and some short message. For weather data i will consume a webservice. I then want to backup this collected data locally on the device. The app should be robust enough to be usable even in remote areas with no internet connection. The failing of a web service call should not break the entire app. So some error handling and fallback is required. The most valuable informations are my geolocation and the short message which i want to record and collect under all circumstances. If a network connection is available i want to be able to post the locally collected data to my Google Drive. Let's call this app **GPSLogger**. 

There will be a corresponding Website to this GPSLogger. This site will simply fetch the serialized data from my Google Drive and visualize the stages of my travel on a simple map. So friends and family can be informed about my location and wellbeing.

## My web components

I built my first simple web components with plain vanilla Javascript. It is really nothing special but it shows the basic structure of a web component.

I used html attributes to 'transfer' (or bind) data to the component. I used 'encapsulated' css to style the component. I used eventhandlers to establish interaction with the component. 

I used custom css properties. Custom css properties will **always** "reach" the web component. This is a way to style a web component from outside.

# About CORS

The **C**ross **O**rigin **R**esource **S**haring is based on HTTP header information.  When a site is sending a response to a request it should send with it the information about the resource sharing in its response header. For example the response header {Access-Control-Allow-Origin:'*'} would indicate that this response can be shared with every origin (wildcard). This means that from the perspective of a web service consumer there is no way to change the CORS behavior of the web service host. Instead the web service host is responsible to decide with which origin he is willing to share his resource. For this a web service host can check the request header for its origin information and than use for example a white list with origins he is willing to share his resources. If the origin of the requester can be found in the white list the web service host should prepare his response header with the appropriate {Access-Control-Allow-Origin:'origin_of_caller'} CORS information. 

There is even a CORS preflight request (a HTTP Option method call). With it a consumer can check, if the remote site supports CORS. 

**CORS is a Browser Thing!** This means it is performed by the browser and happens in the browser. If one is hosting a node js server side app or service and consumes some remote web services cross-origin there is nothing to deal with CORS. The same applies to React Native for example.

But i was trapped by the CORS problem. I'm hosting my PWA on GitHub pages where you can only deploy static web sites. There are no server side technologies available on GitHub pages on which I could have build my own CORS Proxy or a some kind of web service proxy. 

So GitHub pages is the origin of my app. The JavaScript code of my app is running locally on the client device and in the clients browser. That leads to the fact, that fetching the weather data from metaweahter.com is a cross origin call always controlled by CORS.
Now the problem is, that metaweather.com currently don't support CORS headers (check it with the API builder tool of your choice). Thats why the browser will rise a CORS error.

There are some solutions for this kind of problems for example **jsonp** but nowadays there are even more restrictions to further secure web browsers e.g. **C**ross **O**rigin **R**esource **B**locking (CORB). 

In my development environment i use "cors-anywhere", a CORS proxy server which will automatically insert the necessary CORS header in every response from metaweather.com.

``` cmd
cd \My Library\DEV\cors-anywhere
node .\server.js
```



In production environment i use the CORS proxy from https://cors-anywhere.herokuapp.com, but of course only when fetching data from metaweather.com. **A CORS proxy is a matter of trust**. Every data goes through it. Who knows what happens there. 

# How i use the Google API

Google APIs are managed APIs. Some are of cost others are completly free. All APIs have quotas. Before using a managed Google API you have to request it in the Google developer console. This request takes place **on your own behalf**. In response to this request you get an API-Key and a ClientID. These two values are essential for the further usage of the API. Everybody who knows about this two data can now consume the API. So it is very important to keep this data safe and private. That's why it is no good idea to to write down this data in your source code and then host this code in a public source code repository like GitHub. 

On the other hand my app will need this information at runtime to authorize the API usage. In a managed environment i could have  deployed this information safely for example via environment variables which are not public accessible. On GitHub pages there is no way to do it like this. That's why i use a config dialog in my app. On initial use of the app i can deploy the necessary API-Key and ClientID locally and store them on the device itself. This i need to do only once. Because the GPSLogger app is not intended for public but private use, this is one way to keep my secrets secret and still host the app for personal use on GitHub pages free of cost.

There is an additional layer of protection for the API. In the Google Developer console i defined origins from which API calls are allowed. For all the time of development and still now there was/is "localhost" listed. So there are good reason for precaution anyway.

## OAuth

The process of enabling the Google API as described above has nothing to do with my personal google drive account. Instead every user of my app could store his own set of collected data on his own google drive (**if i would deploy the API Key on the hosting server**). Otherwise it would be a really strange app.

But for this to do my app must be able to login to the google drive of the current user. This is another question of trust. Who would provide his own Google cedentials to an untrusty app from an untrusty source without fear? 

This is where the 3-legged Oauth authorization comes in place.   

The protagonists are:

* the resource requester (my app as a client of the users Google drive)
* the resource owner (the user with with his own Google account)
* the resource host (this is Google himself)
* the authorization server (this is the Google hosted OAuth API)

Remark: from the viewpoint of an application developer the resource host and the authorization server are often the same instance.

The simplified flow of data, information and interaction is as follow:

1. The resource requester (my app) turns to the resource host (the Google Drive server) and asks there for dedicated, as fine-grained as possible (no more than necessary) authorization for various artefacts and functions of the resource host.
2. The resource host then contacts the resource owner (the user) and asks for consent to the requested resources. Under certain circumstances, the consent must be preceded by the registration of the resource owner (register with Google). If the now registered resource owner grants access to the resource host, the resource host transmits on behalf of the resource owner, a session key to the resource requester (my app) and thus allows access.
3. The resource requester, authorized by the resource owner, can now access the resource host by using the session key. At no time does it acquire the credentials of the resource owner, because this data is only exchanged between the resource host and the resource owner. The resource requester only has a time-limited access authorization that was provided to it in the form of a session key.

I'm using the Google JavaScript Client Library (gapi) for this whole procedure. In the call of ```gapi.client.init``` one can see, what resources my app is requesting from the resource host. In the authorization flow this will also be displayed to the resource owner, the user.

For a better understanding it is worthy to play through the different scenarios possible. The gapi JavaScript Library is a client side Library. The code will be executed in the browser of the client. So it will make a difference if the current user is already logged into Google or not. Maybe there are page redirects necessary for example to the Google login page and later back to the page of the application. Fortunately all this happens transparently. gapi is using an iframe for this and controls the necessary page flow.

# Whats next?

In this example I only scratched on the surface of web components. There is a lot more to be discovered, for example event bubbling, nesting web components and wire them up with events and event handlers. 

There is a growing number of ready to use web components and there are frameworks that eases to build web components. [This](https://www.polymer-project.org/) is a good starting point to learn more. Alongside my own web components i reused some [shoelace](https://shoelace.style/) web components

# Try out the example web component
Use this [link](https://s01042.github.io/SimpleWebComponent/) to go to github pages, where a little demo is hosted.

# Todo

* ~~add a short message field (SMF) to add/edit some additional informations per entry.~~ 
* ~~implement to delete entries~~
* ~~refactore gapi load and gapi init (load and init only when needed, eg when data should be send)~~
* ~~what if the cors proxy fails or is unavailable?~~ (handle errors and fall back to an entry without these data)
* it is possible to fetch the city and weather data later, for example /api/location/(woeid)/(date)/ but i want to keep it simple
* make it a PWA
* add manifest
* add service worker
* add local caching 



