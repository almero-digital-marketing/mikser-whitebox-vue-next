const os = require('os')
const path = require('path')
const { machineIdSync } = require('node-machine-id')
const Gate = require('./lib/gate')
const PreloadWebpackPlugin = require('preload-webpack-plugin')

if (process.env.NODE_ENV == 'development') {
	const machineId = machineIdSync() + '_' + os.hostname() + '_' + os.userInfo().username
    process.env.VUE_APP_WHITEBOX_CONTEXT = machineId
}

module.exports = {
	outputDir: 'out',
    devServer: {
		progress: false,
		disableHostCheck: true,
		contentBase: [
			path.join(process.cwd(), './public'), 
			path.join(process.cwd(), './out')
		],
		onListening: function (server) {
			const port = server.listeningApp.address().port;

			gate = new Gate(port)
			gate.open()
		}
    },
    css: {
		sourceMap: true
	},
	configureWebpack: {
		optimization: {
			splitChunks: {
				minSize: 10000,
				maxSize: 250000,
			}
		},
		plugins: [
			new PreloadWebpackPlugin({
				include: ['app', 'vendors'],
				rel: 'preload',
				as(entry) {
					if (/\.css$/.test(entry)) return 'style'
					if (/\.woff$/.test(entry)) return 'font'
					if (/\.ttf$/.test(entry)) return 'font'
					if (/\.png$/.test(entry)) return 'image'
					if (/\.jpg$/.test(entry)) return 'image'
					return 'script'
				}
			})
		]
	},
}