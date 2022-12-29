require('../../src/ProcessEvents')(process)

let handle = 0
let count = 0
const load = function () {
    count++
    console.log({ count })
    process.emitEvent('load', { count })
}
process.onEvent('start', function () {
    handle = setInterval(load, 1000 / 60)
})
process.onEvent('stop', function () {
    clearTimeout(handle)
})
process.on('SIGINT', function () {
    process.exit(0)
})