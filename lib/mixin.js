import { mapGetters, mapState, mapActions } from 'vuex'

export default {
	computed: {
		...mapGetters('mikser', [
			'alternates', 
			'document',
			'href',
			'hrefs',
		]),
		...mapState('mikser', [
			'filemap'
		]),
	},
	methods: {
		...mapActions('mikser', [
			'link',
		]),
		storage(file) {
			if(!file) return file
			if (file.indexOf('/storage') != 0 && file.indexOf('storage') != 0) {
				if (file[0] == '/') file = '/storage' + file
				else file = '/storage/' + file
			}
			if (!this.filemap[file]) {
				this.link(file)
			}
			return this.filemap[file] || ''
		},
	},
}
