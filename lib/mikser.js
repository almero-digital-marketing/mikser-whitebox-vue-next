import useRouter from './router'
import useStore from './store'

export async function mikserApp(app, { store, router, config = {} }) {
	app.provide('config', config)

	await useRouter(app, { store, router, config })
	await useStore(app, { store, router, config })
}
