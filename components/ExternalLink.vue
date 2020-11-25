<template>
    <a class="extenal-link" :href="href" :title="title" :target="target" click="trackLink">
        <slot></slot>
    </a>
</template>
<script>
export default {
    props: {
		href: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: ''
        },
        target: {
			type: String,
			default: '_blank'
		}
    },
    methods: {
        trackLink(e) {
            let href = e.target.getAttribute('href')
            let { hostname } = new URL(href)
            window.whitebox.init('analytics', analytics => {
                analytics?.service.context('external', {
                    hostname,
                    href
                })
            })
        }
    }
}
</script>