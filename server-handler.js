const { ZPackage, protocol } = require('node-valheim-core')
const getStringHashes = require('./string-hashes')
const { log } = require('./message-log')
const parseRoutedRpc = require('./routed-rpcs')

let hashes = null

let handlers = {
  "": handleDefault,
  0: handlePong,
  "PeerInfo": handlePeerInfo,
  "RoutedRPC": handleRoutedRPC,
  "ZDOData": handleZDOData,
  "Disconnect": handleDisconnect,
  "ClientHandshake": handleClientHandshake,
  "Error": handleError,
  "PlayerList": handlePlayerList,
  "RemotePrint": handleRemotePrint,
  "RefPos": handleRefPos,
  "NetTime": handleNetTime,
}

module.exports = async (server, client, message) => {
  if (hashes === null)
    hashes = await getStringHashes()

  let reader = new ZPackage(message.data);
  let rpcHash = reader.readInt32()

  let handled = false

  for (const rpcMethod in handlers) {
    if (rpcMethod === rpcHash.toString() || rpcHash === rpcMethod.getStableHashCode()) {
      await handlers[rpcMethod](client, rpcHash, reader)
      handled = true
    }
  }

  if (!handled)
    await handlers[""](client, rpcHash, reader)
}

function handleDefault(client, methodHash, reader) {
  let methodName = null

  if (hashes.rpcs.hasOwnProperty(methodHash))
    methodName = hashes.rpcs[methodHash]

  log('s -> c', methodHash, methodName, {
    buffer: reader.buffer
  })

  client.sendMessage(reader.buffer)
}

function handlePong(client, methodHash, reader) {
  client.sendMessage(reader.buffer)
}

function handlePeerInfo(client, methodHash, reader) {
  let buffer = reader.readBuffer()
  let peerInfo = protocol.server.parsePeerInfo(buffer)

  log('s -> c', methodHash, hashes.rpcs[methodHash], peerInfo)

  client.sendMessage(reader.buffer)
}

function handleZDOData(client, methodHash, reader) {
  let buffer = reader.readBuffer()
  let zdoData = protocol.common.parseZDOData(buffer)

  for (const zdoInfo of zdoData.zdos) {
    let properties = []

    for (const propertyHash in zdoInfo.zdo.int32s)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.int32s[propertyHash]})
    for (const propertyHash in zdoInfo.zdo.floats)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.floats[propertyHash]})
    for (const propertyHash in zdoInfo.zdo.vector3s)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.vector3s[propertyHash]})
    for (const propertyHash in zdoInfo.zdo.quaternions)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.quaternions[propertyHash]})
    for (const propertyHash in zdoInfo.zdo.int64s)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.int64s[propertyHash]})
    for (const propertyHash in zdoInfo.zdo.strings)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.strings[propertyHash]})
    for (const propertyHash in zdoInfo.zdo.buffers)
      properties.push({hash: propertyHash, value: zdoInfo.zdo.buffers[propertyHash]})

    let prefabName = zdoInfo.zdo.prefab

    if (hashes.prefabs.hasOwnProperty(zdoInfo.zdo.prefab)) {
      prefabName = hashes.prefabs[zdoInfo.zdo.prefab]
      zdoInfo.zdo.prefabName = prefabName
    }

    zdoInfo.zdo.namedProperties = {}

    let debugString = `${prefabName} (owner: ${zdoInfo.owner}, position: ${JSON.stringify(zdoInfo.position)}), ${properties.length} properties`
    let incomplete = prefabName === 'Player' ? true : false;

    for (const property of properties) {
      let propertyName = property.hash

      if (hashes.properties.hasOwnProperty(property.hash)) {
        propertyName = hashes.properties[property.hash]
        zdoInfo.zdo.namedProperties[propertyName] = property.value
      }
      else
        incomplete = true

      debugString = `${debugString}\n  - ${propertyName} = ${JSON.stringify(property.value, (key, value) =>
        typeof value === 'bigint'
          ? value.toString()
          : value)}`
    }

    if (incomplete)
      console.log('s -> c', debugString)
  }

  log('s -> c', methodHash, hashes.rpcs[methodHash], zdoData)

  let modifiedZdos = new ZPackage()

  modifiedZdos.writeInt32("ZDOData".getStableHashCode())
  modifiedZdos.writeBuffer(protocol.common.writeZDOData(zdoData.invalidSectors, zdoData.zdos/*.filter(zdo => zdo.zdo.prefab !== "_ZoneCtrl".getStableHashCode())*/))

  client.sendMessage(modifiedZdos.getBuffer())
}

function handleDisconnect(server, methodHash, reader) {
  log('c -> s', methodHash, hashes.rpcs[methodHash], null)

  server.sendMessage(reader.buffer)
}

async function handleRoutedRPC(client, methodHash, reader) {
  let buffer = reader.readBuffer()
  let routedRPC = protocol.common.parseRoutedRPC(buffer)

  if (hashes.routedRpcs.hasOwnProperty(routedRPC.methodHash))
    routedRPC.methodName = hashes.routedRpcs[routedRPC.methodHash]

  if (routedRPC.methodName)
    routedRPC.parameters = await parseRoutedRpc(routedRPC.methodName, routedRPC.parameters)

  log('s -> c', methodHash, hashes.rpcs[methodHash], routedRPC)

  client.sendMessage(reader.buffer)
}

function handleClientHandshake(client, methodHash, reader) {
  let passwordRequired = reader.readBoolean()

  log('s -> c', methodHash, hashes.rpcs[methodHash], { passwordRequired })

  client.sendMessage(reader.buffer)
}

let currentErrorNo = 2

function handleError(client, methodHash, reader) {
  let errorCode = reader.readInt32()

  const errorMessages = {
    0: "None",
    1: "Connecting",
    2: "Connected",
    3: "Version Mismatch",
    4: "Disconnected",
    5: "Connect Failed",
    6: "Incorrect Password",
    7: "User is already connected",
    8: "User is either blacklisted, not whitelisted or has an invalid session ticket", // aka banned
    9: "Server is full",
  }

  log('s -> c', methodHash, hashes.rpcs[methodHash], { errorCode, errorMessage: errorMessages[errorCode] })

  client.sendMessage(reader.buffer)
}

function handlePlayerList(client, methodHash, reader) {
  let buffer = reader.readBuffer()
  let playerList = protocol.server.parsePlayerList(buffer)

  log('s -> c', methodHash, hashes.rpcs[methodHash], playerList)

  client.sendMessage(reader.buffer)
}

function handleRefPos(client, methodHash, reader) {
  let referencePosition = reader.readVector3()
  let publicReferencePosition = reader.readBoolean()

  log('s -> c', methodHash, hashes.rpcs[methodHash], { referencePosition, publicReferencePosition })

  client.sendMessage(reader.buffer)
}

function handleNetTime(client, methodHash, reader) {
  let netTime = reader.readDouble()

  log('s -> c', methodHash, hashes.rpcs[methodHash], { netTime })

  client.sendMessage(reader.buffer)
}

function handleRemotePrint(client, methodHash, reader) {
  let text = reader.readString()

  log('s -> c', methodHash, hashes.rpcs[methodHash], { text })

  client.sendMessage(reader.buffer)
}