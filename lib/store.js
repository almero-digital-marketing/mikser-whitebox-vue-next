import { reactive } from 'vue'

let storageMap = {}
let feedPool = {} 

export default async (app, { router, store }) => {
	store.registerModule('mikser', {
		namespaced: true,
		state: {
			sitemap: {},
			initialized: false,
		},
		getters: {
			storage: () => (file) => {
				if (window.whitebox.services && window.whitebox.services.storage) {
					let link = storageMap[file]
					if (!link) {
						let data = {
							file
						}
						if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
							data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
						}
						link = window.whitebox.services.storage.link(data)
						storageMap[file] = link
					}
					return link
				}
				return file
			},
			alternates: (state) => (href) => {
				let documents = []
				for (let lang of state.sitemap) {
					let document = state.sitemap[lang][href]
					if (document) documents.push(document)
				}
				return documents
			},
			document: (state, getters) => {
				let route = router.documentRoutes[decodeURI(router.currentRoute.value.path)]
				if (!route) return
				let document = getters.href(route.href, route.lang)
				document.route = route
				return document	
			},
			href: (state) => (href, lang) => {
				lang =
					lang ||
					router.currentRoute.value && (router.documentRoutes[router.currentRoute.value.path] && router.documentRoutes[router.currentRoute.value.path].lang) ||
					document.documentElement.lang ||
					''
				let hreflang = state.sitemap[lang]
				if (hreflang) {
					let document = hreflang[href]
					if (document) {
						return {
							meta: document.data.meta,
							link: encodeURI(document.refId),
						}
					} else {
						let reverse = router.reverseRoutes[href]
						if (reverse) {
							let route = reverse.find((record) => record.lang == lang)
							if (route) {
								return {
									link: encodeURI(route.refId),
									meta: {},
								}
							}
						}
					}
				}
				return {
					meta: {},
					link: encodeURI('/' + lang + href),
				}
			},
			hrefs: (state) => (regex, lang) => {
				if (typeof regex == 'string') {
					regex = new RegExp(regex)
				}
				lang =
					lang ||
					(router.documentRoutes[router.currentRoute.value.path] && this.documentRoutes[router.currentRoute.value.path].lang) ||
					document.documentElement.lang ||
					''
				let hreflang = state.sitemap[lang]
				if (hreflang) {
					return Object.keys(router.reverseRoutes)
						.filter((href) => regex.test(href))
						.map((href) => {
							let document = hreflang[href]
							if (document) {
								return {
									loaded: true,
									meta: document.data.meta,
									link: encodeURI(document.refId),
								}
							} else {
								let reverse = router.reverseRoutes[href]
								let route = reverse.find((record) => record.lang == lang)
								if (route) {
									return {
										link: encodeURI(route.refId),
										meta: {},
									}
								}
							}
						})
						.filter((document) => document)
				}
				return []
			},
		},
		mutations: {
			updateDocuments(state, change) {
				if (change.type == 'ready') {
					state.initialized = true
					console.log('Initialization time:', Date.now() - window.startTime + 'ms')
				} else if (change.type == 'initial' || change.type == 'change') {
					let document = change.new
					if (!document) return

					let href = document.data.meta.href || document.data.refId
					let lang = document.data.meta.lang || ''
					
					if (!state.sitemap[lang]) {
						state.sitemap[lang] = reactive({})
					} 
					else {
						let oldDocument = state.sitemap[lang][href]
						if (oldDocument && oldDocument.stamp >= document.stamp) return
					}
					state.sitemap[lang][href] = reactive(Object.freeze(document))
				}
			},
			assignDocument(state, document) {
				let href = document.data.meta.href || document.data.refId
				let lang = document.data.meta.lang || ''
				if (!state.sitemap[lang]) state.sitemap[lang] = reactive({})
				state.sitemap[lang][href] = reactive(Object.freeze(document))
				console.log('Load time:', Date.now() - window.startTime + 'ms', document.refId)
			},
		},
		actions: {
			init({ commit }) {
				window.whitebox.init('feed', (feed) => {
					console.log('Feed loaded')
					window.whitebox.emmiter.on('feed.change', (change) => {
						if (change.type != 'initial') console.log('Feed change', change)
						commit('updateDocuments', change)
					})
					let data = {
						vault: 'feed',
						cache: '1h',
						query: {
							context: 'mikser',
							refId: decodeURI(window.location.pathname),
						},
					}
					if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
						data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
						data.query.context = data.query.context + '_' + data.context
					}
					feedPool[data.query.refId] = 'init'
					feed.service.catalogs.mikser.find(data)
						.then((documents) => {
							for (let document of documents) {
								commit('assignDocument', document)
							}
							feed.service.catalogs.mikser.changes({ 
								vault: 'feed', 
								context: data.context,
								query: { 
									context: data.query.context 
								} 
							})
						})
				})
			},
			load({ commit, state }, items) {
				let loading = []
				let route = router.documentRoutes[decodeURI(window.location.pathname)]
				if (!state.initialized && items.length) {
					window.whitebox.init('feed', (feed) => {
						let refIds = []
						for (let item of items) {
							if (typeof item == 'string') {
								if (route) {
									let reverseRefIds = router.reverseRoutes[item]
									.filter((reverse) => reverse.lang == route.lang && (!state.sitemap[route.lang] || !state.sitemap[route.lang][item]))
									.map((reverse) => reverse.refId)
									.filter((refId) => feedPool[refId] == undefined)
									
									refIds.push(
										...reverseRefIds
									)
									reverseRefIds.forEach(refId => feedPool[refId] = 'load')
								}
							} else {
								let data = {
									vault: 'feed',
									query: Object.assign(item, {
										context: 'mikser',
									}),
								}
								if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
									data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
									data.query.context = data.query.context + '_' + data.context
								}
								loading.push(
									feed.service.catalogs.mikser
									.find(data)
									.then((documents) => {
										for (let document of documents) {
											commit('assignDocument', document)
										}
									})
								)
							}
						}
						if (refIds.length) {
							let data = {
								vault: 'feed',
								cache: '1h',
								query: {
									context: 'mikser',
									refId: {
										$in: refIds,
									},
								},
							}
							if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
								data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
								data.query.context = data.query.context + '_' + data.context
							}
							loading.push(
								feed.service.catalogs.mikser
									.find(data)
									.then((documents) => {
										for (let document of documents) {
											commit('assignDocument', document)
										}
									})
							)
						}
					})
				}
				return Promise.all(loading)
			},
		},
	})
}
