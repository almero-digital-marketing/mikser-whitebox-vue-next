const vue = require('@vitejs/plugin-vue')
const html = require('vite-plugin-html').default
const environment = require('vite-plugin-environment').default
const os = require('os')
const { machineIdSync } = require('node-machine-id')
const Gate = require('./lib/gate')

module.exports = (options, domainConfig) => {
    const machineId = machineIdSync() + '_' + os.hostname() + '_' + os.userInfo().username

    return {
        publicDir: 'out',
        plugins: [
            vue(),
            html({
                inject: {
                    data: {
                        domainConfig
                    },
                },
                minify: true,
            }),
            environment({
                VUE_APP_WHITEBOX_DOMAIN: domainConfig.domain,
                VUE_APP_WHITEBOX_CONTEXT: options.mode == 'development' ? machineId : undefined
            }),
            {
                name: 'gate',
                configureServer(server) {
                    server.httpServer.on('listening', () => {
                        gate = new Gate(server.httpServer.address().port)
				        gate.open()
                    })
                }
            }
        ]
    }
} 