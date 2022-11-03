# Convenience wrapper for pm2

Supports all functionality the original pm2 javascript api provides. Wrapped into promises to use with await.
Adds new functions for emitting and handling events to and from scripts.

## How to use:

Create a script file and immediately call processEvents() with the process itself as argument. This will hook up the event handling module.

### test.js

    require('./index.js').processEvents(process)

    process.onEvent('event', function (data) {
        console.log({ data })
        process.emitEvent('event', { success: true })
        process.exit(0)
    })

Then create a main file and communicate with your script.

### main.js

    const scripts = require('./index.js')
    const manager = new scripts.Manager

    async function main() {
        const script = await manager.start({
            script: './test/scripts/test.js',
            name: 'test'
        })
        script.onEvent('event', function (data) {
            console.log({ data })
        })
        await script.emitEvent('event')
        await manager.delete('test')
        manager.disconnect()
    }

    main()
        .catch(function (error) {
            console.error(error)
        })