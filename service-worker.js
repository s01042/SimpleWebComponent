/*
    ServiceWorkers are totaly event driven
    so we have to hook into the corresponding events
    
    inspect ServiceWorkers with 
    chrome://inspect/#service-workers
    chrome://serviceworker-internals/
*/

const cacheName = 'GPSLogger-V1'

/**
 * static assets should be as compact as possible
 * initialy we only want to cache the assets of the shell app
 * keep in mind that we can load and cache other resources on demand
 */
const staticAssets = [
    './',
    './index.html',
    './index.js',
    './service-worker.js',
    './styles.css',
    './img/hc.svg',
    './img/icon.png',
    './img/icon64.png',
    './components/appConfig.js',
    './components/floatingButton.js',
    './components/serviceComponent.js',
    './components/userCard.js',
    
    './manifest.webmanifest',
    /** the essential external resources */
    'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.20/dist/shoelace/shoelace.css',
    'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.20/themes/dark.css',
    'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.20/dist/shoelace/shoelace.esm.js',
    'https://apis.google.com/js/api.js'
]

/**
 * first the serviceWorker must be installed
 * open the client side cache and store all the
 * static content of the app shell to be ready for offline usage
 */
self.addEventListener ('install', async (e) => {
    const cache = await caches.open (cacheName)
    await cache.addAll (staticAssets)
    /**
     * For a page with no previous service worker files, 
     * the newly installed service worker becomes activated immediately.
     * If the page already has an activated service worker and a new file is pushed, 
     * the new file will still be parsed and installed. Once installed, 
     * it will wait for an opportunity to become activated.
     * by skipWait we are telling the newly installed service worker to skip the waiting state 
     * and move directly to activating.
     */
    return self.skipWaiting ()
})

/**
 * When a serviceWorker is initially registered, 
 * pages won't use it until they next load. 
 * The claim() method causes those pages to be controlled immediately.
 */
self.addEventListener('activate', (e) =>{
    self.clients.claim()
})

/**
 * here we are implementing a hook so that our serviceWorker 
 * can intercept every request
 * there are various caching strategies for different scenarios
 * see https://web.dev/offline-cookbook/#stale-while-revalidate for more informations
 * 
 */
self.addEventListener('fetch', (event) =>{
    /**
     * evaluate the request url and use pattern matching
     * every call to metaweather.com/api will be a network only call
     * without caching, because i want live data or no data
     */
    const requestUrl = new URL (event.request.url)
    /**
     * this pattern will even match calls via the proxy server
     */
    if (/\/www.metaweather.com\/api/.test (requestUrl)) {
        event.respondWith (networkOnly (event.request))
    } else {
        event.respondWith (staleWhileRevalidate (event.request))
    }
})

/**
 * for my RESTful api calls i will establish a network only strategy
 * i'm especially not interested in caching this responses
 * @param {*} request 
 */
async function networkOnly (request) {
    return fetch (request)
}

/**
 * i use stale-while-revalidate for all static content: 
 * if there's a cached version available use it but fetch an update for next time. 
 * @param {*} request 
 */
async function staleWhileRevalidate (request) {
    // open the cache
    const cache = await caches.open (cacheName)
    // try to fetch from cache
    const cachedVersion = await cache.match (request)
    // fetch an update if possible and cache the new version
    try {
        const freshVersion = await fetch (request)
        /**
         * the response of fetch is a stream and because we want the 
         * browser to consume the response as well as the cache 
         * consuming the response, we need to clone it so we have two
         * streams
         */
        await cache.put (request, freshVersion.clone())         
        if (cachedVersion) {
            return cachedVersion
        } else {
            return freshVersion
        } 
    } catch (e) {
        return cachedVersion
    }
}

