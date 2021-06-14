'use strict'
const MuxDemux = require('mux-demux/msgpack')
const reconnect = require('reconnect-net')
const net = require('net')
const os = require('os')
const base32 = require('base32')

class Gate {
	constructor (port) {
		this.connectionManager = {}
		this.ping = {}
		this.gateServer = 'mikser.io'
        this.port = port
	}
	address () {
		let gate = os.hostname().split('.').join('-') + '-' + this.port
		return 'm' + base32.encode(gate) + '.' + this.gateServer
	}
	open () {
		let gate = os.hostname().split('.').join('-') + '-' + this.port
		this.connectionManager[this.port] = reconnect({
			initialDelay: 1e3,
				maxDelay: 30e3,
			strategy: 'fibonacci',
			failAfter: Infinity
		}, (connection) => {
			let mx = MuxDemux((stream) => {
				if (stream.meta.tunnel) {
					stream.pipe(net.connect({port: this.port})).pipe(stream).on('error', console.error)					
				}
			})
			connection.pipe(mx).pipe(connection).on('error', console.error)
			mx.createStream({
				gate: gate
			}).end()

			let pingStream = mx.createStream({
				ping: gate
			}).on('error', (err) => {
				this.connectionManager.disconnect()
				console.error(err)
			})
			if (this.ping[gate]) clearInterval(this.ping[gate])
			this.ping[gate] = setInterval(() => {
				try {
					pingStream.write('ping')	
				} catch(err) { console.error(err) }
			}, 60e3)
		}).connect({
			port: 9090,
			host: this.gateServer
		}).on('reconnect', console.log).on('error', console.error)
        setTimeout(() => {
            console.log('🚪', 'Service gate: https://' + this.address())
        }, 3e3)
	}
	close() {
		if (this.connectionManager[this.port]) {
			this.connectionManager[this.port].disconnect();
		}
	}
}

module.exports = Gate