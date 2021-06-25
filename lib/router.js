export default async (app, { router, store }) => {
	router.documentRoutes = {}
	router.reverseRoutes = {}

	app.provide('documentRoutes', router.documentRoutes)
	app.provide('reverseRoutes', router.reverseRoutes)

	let components = {}
	for (let route of router.options.routes) {
		components[route.name] = route.component
	}
	
	router.beforeEach((to) => {
		window.document.documentElement.lang = to.params.lang || window.document.documentElement.lang
		store.dispatch('mikser/init', to.path)
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
							return {
								path: encodeURI(document.refId),
								component: components[document.data.meta.layout],
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
