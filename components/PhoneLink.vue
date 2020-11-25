<template>
    <a ref="phone" 
        :href="'tel:' + phone" 
        target="_blank" 
        class="phone" 
        :data-whitebox-voip-format="format" 
        :data-whitebox-voip-tag="tag" 
        :data-whitebox-voip-replace="replace">
        <slot></slot>
    </a>
</template>
<script>
export default {
    props: {
        phone: {
			type: String,
			default: ''
		},
		format: {
			type: String,
			default: 'national'
		},
		tag: {
			type: String,
			default: ''
        },
        replace: {
			type: String,
			default: ''
		}
    },
    methods: {
        init() {
            if (this.loaded) {
                window.whitebox.init('voip', voip => {
                    voip?.service.call(this.$refs.phone)
                })
            }
        }
    },
    watch: {
        loaded() {
            this.init()
        }
    },
    mounted() {
        this.init()
    }
}
</script>