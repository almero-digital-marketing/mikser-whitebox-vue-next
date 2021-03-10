import { mapState, mapActions, mapGetters } from 'vuex'

export default {
	inject: ['documentRoutes', 'reverseRoutes'],
	data() {
		return {
			loaded: false,
			documents: [],
		}
	},
	computed: {
		...mapState('mikser', ['sitemap']),
		...mapGetters('mikser', [
			'storage',
			'alternates', 
			'document',
			'href',
			'hrefs'
		]),
	},
	methods: {
		...mapActions({
			$init: 'mikser/init',
			$load: 'mikser/load',
		}),
	},
	created() {
		if (!this.loaded) {
			this.$load(this.documents).then(() => {
				this.loaded = true
			})
		}
	},
}
