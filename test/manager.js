const assert = require('assert')
const { manager } = require('../index.js')

describe('Manager', function () {
    
    const logFile = './test/test_log.txt'

    it('connect', async function () {
        const connected = await manager.connect()
        assert.equal(connected, true)
        const disconnected = manager.disconnect()
        assert.equal(disconnected, true)
    })

    it('events', async function () {
        const test = await new Promise(async function (resolve, reject) {
            try {
                let callbacks = 0
                const script = await manager.start({
                    script: './test/scripts/test.js',
                    name: 'test',
                    log_file: logFile,
                })
                const script2 = await manager.start({
                    script: './test/scripts/test2.js',
                    name: 'test2',
                    log_file: logFile,
                })
                script.onEvent('first', function (data) {
                    callbacks++
                })
                script.onEvent('last', async function (data) {
                    callbacks++
                    await manager.stop('test')
                })
                script2.onEvent('first', function (data) {
                    callbacks++
                })
                script2.onEvent('last', async function (data) {
                    callbacks++
                    await manager.terminate()
                    resolve(callbacks)
                })

                await script.emitEvent('first')
                await script.emitEvent('last')
                await script2.emitEvent('first')
                await script2.emitEvent('last')
            } catch (error) {
                reject(error)
            }
        })

        assert.equal(test, 4)
    })

    it('load', async function () {
        const rounds = 30

        const test = await new Promise(async function (resolve, reject) {
            try {
                const script = await manager.start({
                    script: './test/scripts/test3.js',
                    name: 'test3',
                })
                script.onEvent('load', async function (data) {
                    if (data.count === rounds) {
                        await script.emitEvent('stop')
                        await manager.terminate()
                        resolve(data.count)
                    }
                })
                await script.emitEvent('start')
            } catch (error) {
                reject(error)
            }
        })

        assert.equal(test, rounds)
    })
})
