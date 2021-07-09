const { ZPackage, protocol } = require('node-valheim-core')
const getStringHashes = require('./string-hashes')
const { log } = require('./message-log')
const parseRoutedRpc = require('./routed-rpcs')

let hashes = null

let handlers = {
  "": handleDefault,
  0: handlePing,
  "PeerInfo": handlePeerInfo,
  "RoutedRPC": handleRoutedRPC,
  "ZDOData": handleZDOData,
  "PlayerList": handlePlayerList,
  "RemotePrint": handleRemotePrint,
  "RefPos": handleRefPos,
  "ServerHandshake": handleServerHandshake,
  "Disconnect": handleDisconnect,
  "Kick": handleKick,
  "Ban": handleBan,
  "Unban": handleUnban,
  "Save": handleSave,
  "PrintBanned": handlePrintBanned,
  "CharacterID": handleCharacterID,
}

module.exports = async (client, server, message) => {
  if (hashes === null)
    hashes = await getStringHashes()

  let reader = new ZPackage(message.data);
  let rpcHash = reader.readInt32()

  let handled = false

  for (const rpcMethod in handlers) {
    if (rpcMethod === rpcHash.toString() || rpcHash === rpcMethod.getStableHashCode()) {
      await handlers[rpcMethod](server, rpcHash, reader)
      handled = true
    }
  }

  if (!handled)
    await handlers[""](server, rpcHash, reader)
}

function handleDefault(server, methodHash, reader) {
  let methodName = null

  if (hashes.rpcs.hasOwnProperty(methodHash))
    methodName = hashes.rpcs[methodHash]

  log('c -> s', methodHash, methodName, {
    buffer: reader.buffer
  })

  server.sendMessage(reader.buffer)
}

function handlePing(server, methodHash, reader) {
  server.sendMessage(reader.buffer)
}

function handlePeerInfo(server, methodHash, reader) {
  let buffer = reader.readBuffer()
  let peerInfo = protocol.client.parsePeerInfo(buffer)

  log('c -> s', methodHash, hashes.rpcs[methodHash], peerInfo)

  let authTicket = server.getAuthSessionTicket()

  let modifiedPeerInfoPkg = new ZPackage()
  modifiedPeerInfoPkg.writeInt32("PeerInfo".getStableHashCode())
  modifiedPeerInfoPkg.writeBuffer(protocol.client.writePeerInfo(peerInfo.uid, peerInfo.version, peerInfo.referencePosition, peerInfo.name, peerInfo.passwordHash, authTicket))

  server.sendMessage(modifiedPeerInfoPkg.getBuffer())
}

function handleZDOData(server, methodHash, reader) {
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
      console.log('c -> s', debugString)
  }

  log('c -> s', methodHash, hashes.rpcs[methodHash], zdoData)

  let modifiedZdos = new ZPackage()

  modifiedZdos.writeInt32("ZDOData".getStableHashCode())
  modifiedZdos.writeBuffer(protocol.common.writeZDOData(zdoData.invalidSectors, zdoData.zdos/*.filter(zdo => zdo.zdo.prefab !== "_ZoneCtrl".getStableHashCode())*/))

  server.sendMessage(modifiedZdos.getBuffer())
}

function handlePlayerList(client, methodHash, reader) {
  let buffer = reader.readBuffer()
  let playerList = protocol.server.parsePlayerList(buffer)

  log('c -> s', methodHash, hashes.rpcs[methodHash], playerList)

  client.sendMessage(reader.buffer)
}

function handleRefPos(client, methodHash, reader) {
  let referencePosition = reader.readVector3()
  let publicReferencePosition = reader.readBoolean()

  log('c -> s', methodHash, hashes.rpcs[methodHash], { referencePosition, publicReferencePosition })

  client.sendMessage(reader.buffer)
}

function handleRemotePrint(client, methodHash, reader) {
  let text = reader.readString()

  log('c -> s', methodHash, hashes.rpcs[methodHash], { text })

  client.sendMessage(reader.buffer)
}

async function handleRoutedRPC(server, methodHash, reader) {
  let buffer = reader.readBuffer()
  let routedRPC = protocol.common.parseRoutedRPC(buffer)

  if (hashes.routedRpcs.hasOwnProperty(routedRPC.methodHash))
    routedRPC.methodName = hashes.routedRpcs[routedRPC.methodHash]

  if (routedRPC.methodName)
    routedRPC.parameters = await parseRoutedRpc(routedRPC.methodName, routedRPC.parameters)

  log('c -> s', methodHash, hashes.rpcs[methodHash], routedRPC)

  server.sendMessage(reader.buffer)
}

function handleServerHandshake(server, methodHash, reader) {
  log('c -> s', methodHash, hashes.rpcs[methodHash], null)

  server.sendMessage(reader.buffer)
}

function handleDisconnect(server, methodHash, reader) {
  log('c -> s', methodHash, hashes.rpcs[methodHash], null)

  server.sendMessage(reader.buffer)
}

function handleKick(server, methodHash, reader) {
  let player = reader.readString()

  log('c -> s', methodHash, hashes.rpcs[methodHash], { player })

  server.sendMessage(reader.buffer)
}

function handleBan(server, methodHash, reader) {
  let player = reader.readString()

  log('c -> s', methodHash, hashes.rpcs[methodHash], { player })

  server.sendMessage(reader.buffer)
}

function handleUnban(server, methodHash, reader) {
  let player = reader.readString()

  log('c -> s', methodHash, hashes.rpcs[methodHash], { player })

  server.sendMessage(reader.buffer)
}

function handleSave(server, methodHash, reader) {
  log('c -> s', methodHash, hashes.rpcs[methodHash], null)

  server.sendMessage(reader.buffer)
}

function handlePrintBanned(server, methodHash, reader) {
  log('c -> s', methodHash, hashes.rpcs[methodHash], null)

  server.sendMessage(reader.buffer)
}

function handleCharacterID(server, methodHash, reader) {
  let characterId = reader.readZDOId()

  log('c -> s', methodHash, hashes.rpcs[methodHash], { characterId })

  server.sendMessage(reader.buffer)
}