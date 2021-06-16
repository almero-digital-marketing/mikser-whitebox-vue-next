import { reactive } from 'vue'

let feedPool = {} 

export default async (app, { router, store }) => {
	store.registerModule('mikser', {
		namespaced: true,
		state: {
			sitemap: {},
			filemap: {}
		},
		getters: {
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
			href: (state) => (href, lang, loaded) => {
				if (typeof lang == 'boolean') {
					loaded = lang
					lang = undefined
				}
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
							loaded: true,
							meta: document.data.meta,
							link: encodeURI(document.refId),
						}
					} else {
						let reverse = router.reverseRoutes[href]
						if (reverse) {
							let route = reverse.find((record) => record.lang == lang)
							if (route && !loaded) {
								return {
									link: encodeURI(route.refId),
									meta: {},
								}
							}
						}
					}
				}
				if (loaded) return
				return {
					meta: {},
					link: encodeURI('/' + lang + href),
				}
			},
			hrefs: (state) => (regex, lang, loaded) => {
				if (typeof lang == 'boolean') {
					loaded = lang
					lang = undefined
				}
				if (typeof regex == 'string') {
					regex = new RegExp(regex)
				}
				lang =
					lang ||
					(router.documentRoutes[router.currentRoute.value.path] && router.documentRoutes[router.currentRoute.value.path].lang) ||
					document.documentElement.lang ||
					''
				let hreflang = state.sitemap[lang]
				if (hreflang) {
					const documents = Object.keys(router.reverseRoutes)
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
						.filter(document => document)
					if (loaded) {
						if (!documents.find(document => !document.loaded)) return documents
					}
				}
				return []
			},
		},
		mutations: {
			updateDocuments(state, change) {
				if (change.type == 'ready') {
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
			assignDocuments(state, documents) {
				for (let document of documents) {
					let href = document.data.meta.href || document.data.refId
					let lang = document.data.meta.lang || ''
					if (!state.sitemap[lang]) state.sitemap[lang] = reactive({})
					state.sitemap[lang][href] = reactive(Object.freeze(document))
				}
				console.log('Load time:', Date.now() - window.startTime + 'ms')
			},
			updateFilemap(state, { file, link }) {
				if (state.filemap[file] != link) {
					state.filemap[file] = link
				}
			}
		},
		actions: {
			init({ commit, state }, items = []) {
				return new Promise(resolve => {
					window.whitebox.init('feed', (feed) => {
						let loading = []
						let route = router.documentRoutes[decodeURI(window.location.pathname)]
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
										commit('assignDocuments', documents)
									})
								)
							}
						}

						let documentRefId = decodeURI(window.location.pathname)
						if (feedPool[documentRefId] == undefined) {
							refIds.push(documentRefId)
							feedPool[documentRefId] = 'load'
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
									commit('assignDocuments', documents)
								})
							)
						}
						return Promise.all(loading).then(resolve)
					})
				})
			},
			live({ commit }, initial) {
				window.whitebox.init('feed', (feed) => {
					window.whitebox.emmiter.on('feed.change', (change) => {
						if (change.type != 'ready') console.log('Feed change', change)
						commit('updateDocuments', change)
					})
					let dataContext
					let queryContext = 'mikser'
					if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
						dataContext = process.env.VUE_APP_WHITEBOX_CONTEXT
						queryContext = queryContext + '_' + dataContext
					}

					feed.service.catalogs.mikser.changes({ 
						vault: 'feed', 
						context: dataContext,
						query: { 
							context: queryContext
						},
						initial
					})
				})
			},
			link({ commit }, file) {
				window.whitebox.init('storage', (storage) => {
					if (storage) {
						let data = {
							file,
							cache: process.env.NODE_ENV == 'production'
						}
						if (process.env.VUE_APP_WHITEBOX_CONTEXT) {
							data.context = process.env.VUE_APP_WHITEBOX_CONTEXT
						}
						let result = storage.service.link(data)
						if (typeof result == 'string') {
							commit('updateFilemap', {
								file, 
								link: result
							})
						} else {
							result.then(link => {
								commit('updateFilemap', {
									file, 
									link
								})
							})
						}
					}
				})
			}
		},
	})
}
