import { mapGetters, mapActions } from 'vuex'

let mikserMixin = {
	computed: {
		...mapGetters('mikser', [
			'alternates', 
			'document',
			'href',
			'hrefs',
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
			if (!this.$store.state.mikser.filemap[file]) {
				this.link(file)
			}
			return this.$store.state.mikser.filemap[file] || ''
		},
	},
}

export { mikserMixin }