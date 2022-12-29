/**
 * Convenience wrapper for pm2 scripts to send and receive events
 * to the underlying node process.
 */
class Script {
    constructor(manager, data) {
        Object.assign(this, data)
        this.events = {}
        this.manager = manager
        this.manager.reroute(this)
    }

    async emitEvent(event, data) {
        if (!data) data = {}
        data.event = event
        const response = await this.send({ data })
        return response
    }

    handle(packet) {
        const { event } = packet.data
        if (this.events[event]) {
            this.events[event].forEach(function (handler) {
                return handler(packet.data)
            })
        }
    }

    async send(packet) {
        packet.id = this.name
        const response = await this.manager.send(packet)
        return response
    }

    onEvent(event, handler) {
        if (!this.events[event]) this.events[event] = []
        this.events[event].push(handler)
    }
}

module.exports = { Script }
