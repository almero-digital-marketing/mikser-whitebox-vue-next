import mixin from './lib/mixin'
import router from './lib/router'
import store from './lib/store'

export default async (app, mikser) => {
	mikser.config = Object.assign({}, mikser.config)

	await router(mikser, mikser.router)
	await store(mikser, mikser.store)
	app.mixin(mixin(mikser))
	return mikser
}
