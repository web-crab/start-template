//  Кэширование стартовой страницы
self.addEventListener('install', event => {
    const indexPage = new Request('index.html')
    event.waitUntil(fetch(indexPage).then(response => {
      return caches
        .open('pwabuilder-offline')
        .then(cache => cache.put(indexPage, response))
    }))
})
  
//  Если нет подключения к сети - достаем страницу из кэша
self.addEventListener('fetch', event => {

    const updateCache = request => {
        return caches
        .open('pwabuilder-offline')
        .then(cache => fetch(request).then(response => cache.put(request, response)))
    }

    event.waitUntil(updateCache(event.request))

    event.respondWith(fetch(event.request).catch(error => {
        return caches
        .open('pwabuilder-offline')
        .then(cache => {
            return cache
            .match(event.request)
            .then(matching => (!matching || matching.status == 404) ? Promise.reject('no-match') : matching)
        })
    }))
})