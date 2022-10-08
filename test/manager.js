const assert = require('assert')
const scripts = require('../index.js')

const manager = new scripts.Manager

describe('Manager', function () {

    it('events', async function () {

        const test = await new Promise(async function (resolve, reject) {

            try {

                let callbacks = 0
                const script = await manager.start({
                    script: './test/scripts/test.js',
                    name: 'test'
                })
                const script2 = await manager.start({
                    script: './test/scripts/test2.js',
                    name: 'test2'
                })
                script.onEvent('first', async function (data) {
                    //console.log({ data })
                    callbacks++
                })
                script.onEvent('last', async function (data) {
                    //console.log({ data })
                    callbacks++
                    await manager.delete('test')
                })
                script2.onEvent('first', async function (data) {
                    //console.log({ data })
                    callbacks++
                })
                script2.onEvent('last', async function (data) {
                    //console.log({ data })
                    callbacks++
                    await manager.delete('test2')
                    manager.disconnect()
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

        const test = await new Promise(async function (resolve, reject) {
            
            try {

                const script = await manager.start({
                    script: './test/scripts/test3.js',
                    name: 'test3'
                })
                script.onEvent('load', async function (data) {
                    //console.log({ data })
                    if (data.count === 2) {
                        await script.emitEvent('stop')
                        await manager.delete('test3')
                        manager.disconnect()
                        resolve(data.count)
                    }
                })
                await script.emitEvent('start')

            } catch (error) {
                reject(error)
            }

        })

        assert.equal(test, 2)
        
    })

})