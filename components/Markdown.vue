<template>
	<div class="markdown" v-html="markdown" @click="routeLinks"></div>
</template>
<script>
import MarkdownIt from 'markdown-it'

export default {
	inject: ['domainConfig'],
	props: {
		source: {
			type: String,
			default: ''
		},
		lang: {
			type: String,
			default: ''
		},
		plugins: {
			type: Array,
			default: []
		}
	},
	computed: {
		markdown() {
			let markdown = new MarkdownIt({
				html: true,
				breaks: true, 
			})
			this.plugins.forEach(({ plugin, options }) => {
				markdown.use(plugin, options)
			})
			
			markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
				const token = tokens[idx]
				const hrefIndex = token.attrIndex('href')
				if (hrefIndex >= 0) {
					const link = token.attrs[hrefIndex]
					const href = link[1]
					const isExternal = /^https?:/.test(href)
					const isPhone = /^tel:/.test(href)
					if (isExternal || isPhone) {
						const targetIndex = token.attrIndex('target')
						if (targetIndex < 0) {
							tokens[idx].attrPush(['target', '_blank'])
						} else {
							tokens[idx].attrs[targetIndex][1] = '_blank'
						}
						tokens[idx].attrPush(['rel', 'noopener'])
						
						if (isPhone) {
							const [phone, tag] = href.split('@')
							tokens[idx].attrs[hrefIndex][1] = phone
							tokens[idx].attrPush(['data-whitebox-voip-tag', tag])
							let format = phone.replace('tel:', '')
							if (format.indexOf('00') == 0 || format.indexOf('+') == 0) {
								tokens[idx].attrPush(['data-whitebox-voip-format', 'international'])
							} else {
								tokens[idx].attrPush(['data-whitebox-voip-format', 'national'])
							}
						}
					}
					return self.renderToken(tokens, idx, options)
				}
			}

			return markdown.render(this.source || '')
		},
	},
	mounted() {
		this.voip()
	},
	updated() {
		this.voip()
	},
	methods: {
		voip() {
			for(let link of this.$el.querySelectorAll("a")) {
				let href = decodeURI(link.getAttribute('href'))
				const isPhone = /^tel:/.test(href)
				if (isPhone) {
					window.whitebox.init('voip', voip => {
						voip?.service.call(link)
					})
				}
			}
		},
		routeLinks(e) {
			let lang =
				this.lang ||
				this.$route && (this.domainConfig.documentRoutes[this.$route.path] && this.domainConfig.documentRoutes[this.$route.path].document.meta.lang) ||
				document.documentElement.lang ||
				''
			if (e.target.tagName == 'A') {
				let href = decodeURI(e.target.getAttribute('href'))
				if (/_blank/i.test(e.target.getAttribute('target'))) {
					const isPhone = /^tel:/.test(href)
					if (!isPhone) {
						let { hostname } = new URL(href)
						window.whitebox.init('analytics', analytics => {
							analytics?.service.context('external', {
								hostname,
								href
							})
						})
					}
				} else {
					let reverse = this.domainConfig.reverseRoutes[href]
					if (reverse) {
						let route = reverse.find((documentRoute) => documentRoute.document.meta.lang == lang)
						if (route) {
							this.$router.push(route.refId)
							e.preventDefault()
						}
					}
				}
			}
		}
	}
}
</script>