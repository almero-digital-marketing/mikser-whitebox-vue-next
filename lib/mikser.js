import useRouter from './router'
import useStore from './store'

export function mikserApp(app, { store, router, domainConfig = {} }) {
	app.provide('domainConfig', domainConfig)
	useRouter(app, { store, router, domainConfig })
	useStore(app, { store, router, domainConfig })

	domainConfig.projection = domainConfig.projection || {}
	Object.assign(domainConfig.projection, {
		'data.meta.layout': 1,
		'refId': 1,
		'data.meta.href': 1,
		'data.meta.route': 1,
		'data.meta.lang': 1,
		'data.meta.type': 1, 
	})

	return async () => {
		let routeDefinitions = {}
		for (let route of router.options.routes) {
			routeDefinitions[route.name] = route
		}
	
		return new Promise((resolve, reject) => {
			window.whitebox.init('feed', (feed) => {
				let data = {
					vault: 'feed',
					query: { context: 'mikser' },
					projection: domainConfig.projection,
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
							let routes = []
							for (let document of documents) {
								router.reverseRoutes[document.data.meta.href] = router.reverseRoutes[document.data.meta.href] || []
								router.reverseRoutes[document.data.meta.href].push({ 
									refId: document.refId,
									document: document.data
								})
								router.documentRoutes[document.refId] = {
									href: document.data.meta.href,
									document: document.data
								}
								const routeDefinition = routeDefinitions[document.data.meta.layout] || {}
								routes.push({
									path: encodeURI(document.refId),
									component: routeDefinition.component,
									meta: routeDefinition.meta,
									alias: ['/' + document.data.meta.lang + document.data.meta.href],
									props: router.documentRoutes[document.refId],
								})
								if (document.data.meta.route) {
									let documentMeta = { ...routeDefinition.meta }
									documentMeta.refId = document.refId
									if (documentMeta.documents) {
										if (Array.isArray(documentMeta.documents)) {
											documentMeta.documents = [document.refId, ...documentMeta.documents]
										} else {
											documentMeta.documents = [document.refId, documentMeta.documents]
										}
									} else {
										documentMeta.documents = document.refId
									}
									routes.push({
										path: encodeURI(document.refId) + document.data.meta.route,
										component: routeDefinition.component,
										meta: documentMeta,
										props: router.documentRoutes[document.refId],
									})
								}
							}
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
}
