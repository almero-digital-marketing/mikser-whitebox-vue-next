function mikserRouter (app, { router, store, domainConfig }) {

	router.beforeEach((to, from, next) => {
		window.document.documentElement.lang = to.params.lang || window.document.documentElement.lang
		if(!store.state.mikser.currentRefId) store.dispatch('mikser/setCurrent', router.currentRoute.value)

		let documents = []
		let documentRoute = domainConfig.documentRoutes[decodeURI(to.path)]
		if (documentRoute) {
			documents.push(to.path)
		}
		let data = []
		for(let matched of to.matched) {
			if (matched.meta.documents) {
				if (Array.isArray(matched.meta.documents)) {
					documents.push(...matched.meta.documents)
				} else {
					documents.push(matched.meta.documents)
				}
			}
			if (matched.meta.data) {
				data.push(matched.meta.data)
			}
			if (matched.meta.refId) {
				documentRoute = domainConfig.documentRoutes[matched.meta.refId]
				documents.unshift(matched.meta.refId)
			}
		}
		store.dispatch('mikser/init', documents)
        .then(() => {
			if (data.length) {
				documents = []
				const document = store.state.mikser.sitemap[documentRoute.document.meta.lang][documentRoute.href]
				for(let dataCallback of data) {
					const dataDocuments = dataCallback({
						meta: document.data.meta,
						link: encodeURI(document.refId),
					})
					if (Array.isArray(dataDocuments)) {
						documents.push(...dataDocuments)
					} else {
						documents.push(dataDocuments)
					}
				}
				store.dispatch('mikser/init', documents)
				.then(() =>	next())
			} else {
				next()
			}
		})
        .catch(err => next(err))
	})
	
	router.afterEach((to) => {
		store.dispatch('mikser/setCurrent', router.currentRoute.value)
		
		window.whitebox.init('analytics', analytics => {
			if (analytics) {
				setTimeout(() => {
					console.log('Track route:', decodeURI(to.path))
					analytics.service.info()
				}, 100)
			}
		})
	})
}
export { mikserRouter }