const os = require('os')
const path = require('path')
const { machineIdSync } = require('node-machine-id')

if (process.env.NODE_ENV == 'development') {
	const machineId = machineIdSync() + '_' + os.hostname() + '_' + os.userInfo().username
    process.env.VUE_APP_WHITEBOX_CONTEXT = machineId
}

module.exports = {
	outputDir: 'out',
    devServer: {
		progress: false,
		contentBase: [
			path.join(process.cwd(), './public'), 
			path.join(process.cwd(), './out')
		],
    },
    css: {
		sourceMap: true
	}
}