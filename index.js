import mixin from './mixin'
import router from './router'
import store from './store'

export default async (app, mikser) => {
	await router(mikser, mikser.router)
	await store(mikser, mikser.store)
	app.mixin(mixin(mikser))
	return mikser
}
