<template>
	<div class="metatext" v-html="metatext"></div>
</template>
<script>
export default {
	props: {
		source: {
			type: String,
			default: ''
		},
	},
	computed: {
		metatext() {
		if (typeof this.source != 'string') {
			let err = new Error('Argument is not a string');
			err.origin = 'metatext';
			throw err;
		}
		return this.source
			.replaceAll('<','<<')
			.replaceAll('>','>>')
			.replaceAll('<<','<s>')
			.replaceAll('>>','</s>')
			.replaceAll('{','<u>')
			.replaceAll('}','</u>')
			.replaceAll('(','<b>')
			.replaceAll(')','</b>')
			.replaceAll('[','<i>')
			.replaceAll(']','</i>')
			.replaceAll('|','<br>')
			.replaceAll('_','<hr>')
			.replaceAll('~','&nbsp;');
		},
	},
}
</script>