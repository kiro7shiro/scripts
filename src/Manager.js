const { promisify } = require('util')
const pm2 = require('pm2')
const { Script } = require('./Script.js')

/**
 * Convenience wrapper for pm2
 */
class Manager {
    
    static connect = promisify(pm2.connect.bind(pm2))
    static delete = promisify(pm2.delete.bind(pm2))
    static disconnect = pm2.disconnect.bind(pm2)
    static list = promisify(pm2.list.bind(pm2))
    static launchBus = promisify(pm2.launchBus.bind(pm2))
    static send = promisify(pm2.sendDataToProcessId.bind(pm2))
    static start = promisify(pm2.start.bind(pm2))
    static stop = promisify(pm2.stop.bind(pm2))

    constructor() {
        this.bus = null
        this.connected = false
        this.handlers = {}
    }

    /**
     * Connects to local pm2 instance or spawns a new one.
     * @returns {Error|Boolean}
     */
    async connect() {
        try {
            await Manager.connect()
            this.connected = true
            return true
        } catch (error) {
            return error
        }
    }

    /**
     * Remove a script from pm2 list.
     * @param {String} name of the script to remove from pm2 list
     * @returns {Error|Boolean}
     */
    async delete(name) {
        try {
            await Manager.delete(name)
            return true
        } catch (error) {
            return error
        }
    }

    /**
     * Disconnect from pm2.
     */
    disconnect() {
        try {
            this.bus = null
            this.connected = false
            Manager.disconnect()
            return true
        } catch (error) {
            return error
        }
    }

    /**
     * Get a list of processes managed by pm2.
     * @param {Object} [options]
     * @param {String} [options.name] get a specific script
     * @returns {Array|Script}
     */
    async list({ name = null } = {}) {
        try {
            const list = await Manager.list()
            if (!name) return list
            const [script] = list.filter(function (s) {
                return s.name === name
            })
            if (script) return script
            return false
        } catch (error) {
            return error
        }
    }

    /**
     * Launch an bus to communicate with scripts.
     * @returns {Error|Bus}
     */
    async launchBus() {
        try {
            const self = this
            const bus = await Manager.launchBus()
            bus.on('process:msg', function (packet) {
                const { name } = packet.process
                if (self.handlers[name]) self.handlers[name](packet)
            })
            self.bus = bus
            return bus
        } catch (error) {
            return error
        }
    }

    /**
     * Reroute events to a script.
     * @param {Script} script which to reroute events to
     */
    reroute(script) {
        this.handlers[script.name] = script.handle.bind(script)
    }

    /**
     * Send a set of data as object to a specific script.
     * @param {Object} packet
     * @returns {Error|Object|Boolean}
     */
    async send(packet) {
        try {
            if (!packet.id) return new Error('Id must be set.')
            if (!packet.data) return new Error('Data must be given.')
            if (!packet.topic) packet.topic = true
            packet.type = 'process:msg'
            if (typeof packet.id === 'string') {
                const proc = await this.list({ name: packet.id })
                if (proc) {
                    packet.id = proc.pm_id
                } else {
                    return new Error(`Cannot find script named: ${packet.id}`)
                }
            }
            const response = await Manager.send(packet)
            return response
        } catch (error) {
            return error
        }
    }

    /**
     * Start a script that will be managed by pm2.
     * @param {Object} data
     * @returns {Error|Script}
     */
    async start(data) {
        try {
            if (!this.connected) await this.connect()
            if (!this.bus) await this.launchBus()
            const script = new Script(this, data)
            await Manager.start(script)
            return script
        } catch (error) {
            return error
        }
    }

    /**
     * Stop a running script and remove it from pm2 list.
     * @param {String} name of the script to be stopped
     * @param {Object} options
     * @param {Boolean} options.remove remove the script from pm2 list, too
     * @returns {Error|Boolean}
     */
    async stop(name, { remove = true } = {}) {
        try {
            const response = await this.send({ id: name, data: { event: 'sigtest' } })
            console.log({ response })
            await Manager.stop(name)
            if (remove) await this.delete(name)
            return true
        } catch (error) {
            return error
        }
    }

    /**
     * Terminate the manager and disconnect from pm2.
     * @param {Object} options
     * @param {Boolean} options.stop stop all scripts controlled by the manager
     * @param {Boolean} options.remove remove the scripts from pm2 list, too
     */
    async terminate({ stop = true, remove = true } = {}) {
        if (stop) {
            const list = await this.list()
            for (let sCnt = 0; sCnt < list.length; sCnt++) {
                const script = list[sCnt]
                await this.stop(script.name, { remove })
            }
        }
        this.disconnect()
    }
}

const manager = new Manager()

module.exports = { manager }
