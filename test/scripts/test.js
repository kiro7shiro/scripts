require('../../src/ProcessEvents')(process)

process.onEvent('first', function (data) {
    console.log({ test: __filename, data })
    process.emitEvent('first', { success: true })
})

process.onEvent('last', function (data) {
    console.log({ test: __filename, data })
    process.emitEvent('last', { success: true })
})

process.on('SIGINT', function () {
    console.log({ test: __filename, data: 'SIGINT' })
    process.exit(0)
})
