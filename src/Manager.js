const pm2 = require('pm2')
const { Script } = require('./Script.js')

/**
 * Convenience wrapper for pm2
 */
class Manager {

    constructor() {
        this.bus = undefined
        this.connected = false
        this.handlers = {}
    }

    connect() {
        const self = this
        return new Promise(function (resolve, reject) {
            pm2.connect(function (error) {
                if (error) reject(error)
                self.connected = true
                resolve(true)
            })
        })
    }

    delete(name) {
        return new Promise(function (resolve, reject) {
            pm2.delete(name, function (error) {
                if (error) reject(error)
                resolve(true)
            })
        })
    }

    disconnect() {
        this.bus = undefined
        this.connected = false
        pm2.disconnect()
    }

    list({ name = undefined } = {}) {
        return new Promise(function (resolve, reject) {
            pm2.list(function (error, list) {
                if (error) reject(error)
                if (!name) resolve(list)
                const [script] = list.filter(function (s) {
                    return s.name === name
                })
                if (script) resolve(script)
                resolve(false)
            })
        })
    }

    launchBus() {
        const self = this
        return new Promise(function (resolve, reject) {
            pm2.launchBus(function (error, bus) {
                if (error) reject(error)
                self.bus = bus
                self.bus.on('process:msg', function (packet) {
                    const { name } = packet.process
                    if (self.handlers[name]) self.handlers[name](packet)
                })
                resolve(bus)
            })
        })
    }

    reroute(script) {
        this.handlers[script.name] = script.handle.bind(script)
    }

    /**
     * Send a set of data as object to a specific process.
     * @param {Object} packet 
     * @returns {Error|Object|Boolean}
     */
    async send(packet) {
        if (!packet.id) throw new Error('Id must be set.')
        if (!packet.data) throw new Error('Data must be given.')
        if (!packet.topic) packet.topic = true
        packet.type = 'process:msg'
        if (typeof packet.id === 'string') {
            const proc = await this.list({ name: packet.id })
            if (proc) {
                packet.id = proc.pm_id
            } else {
                throw new Error(`Cannot find script named: ${packet.id}`)
            }
        }
        return new Promise(function (resolve, reject) {
            pm2.sendDataToProcessId(packet, function (error, response) {
                if (error) reject(error)
                if (response && response.success) resolve(response)
                resolve(false)
            })
        })
    }

    /**
     * Start a script that will be managed by pm2.
     * @param {Object} data 
     * @returns {Error|Script}
     */
    async start(data) {
        if (!this.connected) await this.connect()
        if (!this.bus) await this.launchBus()
        const script = new Script(this, data)
        return new Promise(function (resolve, reject) {
            pm2.start(script, function (error) {
                if (error) reject(error)
                resolve(script)
            })
        })
    }

    stop(name) {
        return new Promise(function (resolve, reject) {
            pm2.stop(name, function (error) {
                if (error) reject(error)
                resolve(true)
            })
        })
    }
}

module.exports = { Manager }