import { mapGetters } from 'vuex'

export default {
	computed: {
		...mapGetters('mikser', [
			'storage',
			'alternates', 
			'document',
			'href',
			'hrefs'
		]),
	},
}
