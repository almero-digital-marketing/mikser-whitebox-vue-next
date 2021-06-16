import { mapGetters, mapState, mapActions } from 'vuex'

export default {
	computed: {
		...mapGetters('mikser', [
			'alternates', 
			'document',
			'href',
			'hrefs'
		]),
		...mapState('mikser', [
			'filemap'
		]),
	},
	methods: {
		...mapActions('mikser', [
			'link'
		]),
		storage(file) {
			if (!this.filemap[file]) {
				this.link(file)
			}
			return this.filemap[file] || ''
		}
	}
}
