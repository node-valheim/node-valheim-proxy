const fastify = require('fastify')({ logger: false })
const { SteamGameServer, SteamGameClient } = require('node-steamworks')
const handleClientMessage = require('./client-handler')
const handleServerMessage = require('./server-handler')
const { messages } = require('./message-log')

fastify.get('/', async (request, reply) => {
    return JSON.stringify(messages, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value, 2)
})

const start = async () => {
    let server = new SteamGameServer(+process.env.PROXY_PORT)
    let client = null // = new SteamGameClient(process.env.PROXY_TARGET)

    server.on('started', () => {
        console.log(`proxy server listening on port ${server.port}`)
    })

    server.on('connected', (realClient) => {
        console.log(`real client connected ${realClient.connectionDescription}, starting proxy client...`)

        client = new SteamGameClient(process.env.PROXY_TARGET)
        client.startClient()

        let connected = false
        let queuedMessages = []

        client.on('started', () => {
            console.log("proxy client started")
        })

        client.on('connected', () => {
            console.log(`proxy client connected to ${client.server}`)
            connected = true

            for (const message of queuedMessages) {
                realClient.emit('message', message)

                //client.sendMessage(message)
            }

            queuedMessages = []
        })

        client.on('message', event => {
            handleServerMessage(server, realClient, event)
        })

        client.on('disconnected', event => {
            console.log(`proxy client disconnected`)
            client.running = false
            client = null
        })

        realClient.on('message', event => {
            if (!connected)
                queuedMessages.push(event)
            else {
                handleClientMessage(realClient, client, event)
            }
        })

        realClient.on('disconnected', () => {
            console.log("real client disconnected");
        })
    })

    server.startServer()

    fastify.listen(3000)

    while (server.running) {
        server.runCallbacks()

        if (client !== null) {
            client.runCallbacks()
        }

        await (new Promise(resolve => {
            setTimeout(resolve, 10)
        }))
    }
}

start()