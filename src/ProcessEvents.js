/**
 * Convenience wrapper for node processes to send and receive events.
 * @param {Object} proc node process
 */
module.exports = function (proc) {
    proc.handlers = {}
    proc.emitEvent = function (event, data) {
        data.event = event
        process.send({
            type: 'process:msg',
            data: data
        })
    }
    proc.onEvent = function (event, handler) {
        if (!proc.handlers[event]) proc.handlers[event] = []
        proc.handlers[event].push(handler)
    }
    // reroute event handlers
    proc.on('message', function (packet) {
        const { event } = packet.data
        if (proc.handlers[event]) {
            proc.handlers[event].forEach(handler => handler(packet.data))
        }
    })
}