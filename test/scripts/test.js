require('../../src/ProcessEvents')(process)

process.onEvent('first', function (data) {
    console.log({ data })
    process.emitEvent('first', { success: true })
})

process.onEvent('last', function (data) {
    console.log({ data })
    process.emitEvent('last', { success: true })
    process.exit(0)
})
