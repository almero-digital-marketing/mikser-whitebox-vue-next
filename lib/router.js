export default async (app, { router, store }) => {
	router.documentRoutes = {}
	router.reverseRoutes = {}

	app.provide('documentRoutes', router.documentRoutes)
	app.provide('reverseRoutes', router.reverseRoutes)

	let routeDefinitions = {}
	for (let route of router.options.routes) {
		routeDefinitions[route.name] = route
	}
	
	router.beforeEach((to, from, next) => {
		window.document.documentElement.lang = to.params.lang || window.document.documentElement.lang
		const documents = [to.path]
		for(let matched of to.matched) {
			if (typeof matched.meta.documents == 'function') {
				documents.push(...matched.meta.documents(to, from, { router, store }))
			} else if (matched.meta.documents) {
				documents.push(...matched.meta.documents)
			}
		}
		store.dispatch('mikser/init', documents)
        .then(() => {
			next()
		})
        .catch(err => next(err))
	})
	
	router.afterEach((to) => {
		window.whitebox.init('analytics', analytics => {
			if (analytics) {
				setTimeout(() => {
					console.log('Track route:', decodeURI(to.path))
					analytics.service.info()
				}, 100)
			}
		})
	})

	return new Promise((resolve, reject) => {
		window.whitebox.init('feed', (feed) => {
			let data = {
				vault: 'feed',
				query: { context: 'mikser' },
				projection: {
					'data.meta.layout': 1,
					refId: 1,
					'data.meta.href': 1,
					'data.meta.lang': 1,
					'data.meta.type': 1,
				},
				cache: '1h',
			}
			if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
				data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
				data.query.context = data.query.context + '_' + data.context
			}
			if (feed.service.catalogs.mikser) {
				feed.service.catalogs.mikser
					.find(data)
					.then((documents) => {
						let routes = documents.map((document) => {
							router.reverseRoutes[document.data.meta.href] = router.reverseRoutes[document.data.meta.href] || []
							router.reverseRoutes[document.data.meta.href].push({ 
								refId: document.refId,
								lang: document.data.meta.lang
							})
							router.documentRoutes[document.refId] = {
								lang: document.data.meta.lang,
								href: document.data.meta.href,
							}
							const routeDefinition = routeDefinitions[document.data.meta.layout] || {}
							return {
								path: encodeURI(document.refId),
								component: routeDefinition.component,
								meta: routeDefinition.meta,
								alias: '/' + document.data.meta.lang + document.data.meta.href,
								props: router.documentRoutes[document.refId],
							}
						})
						for(let route of routes.filter(route => route.component)) {
							router.addRoute(route)
						}
						console.log('Routes:', routes.length, Date.now() - window.startTime + 'ms') //, routes)
						resolve()
					})
					.catch(reject)
			} else {
				console.warn('Mikser catalog is missing')
			}
		})
	})
}
