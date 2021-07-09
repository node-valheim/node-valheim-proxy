const { ZPackage } = require('node-valheim-core')

const handlers = {
  "OnNearProjectileHit": handleOnNearProjectileHit, // vec3 center, float range, zdoId attacker, baseai.cs
  "Alert": handleNoop, // noop, baseai.cs
  "SetOwner": handleSetOwner, // int64 uid, string name, on beds
  "Extract": handleNoop, // noop, on beehives
  "Heal": handleHeal, // float hp, bool showText // character.cs
  "Damage": handleDamage, // HitData // also on desctructible.cs, TreeBase.cs, TreeLog.cs
  "Stagger": handleStagger, // vector3 forcedirection
  "AddNoise": handleAddNoise, // float range
  "ResetCloth": handleNoop, // noop
  "SetTamed": handleSetTamed, // bool tamed
  "RequestOpen": handleRequestOpen, // int64 playerId // container.cs
  "OpenRespons": handleOpenResponse, // bool opened
  "RequestTakeAll": handleRequestTakeAll, // int64 playerId
  "TakeAllRespons": handleTakeAllResponse, // bool granted
  "SetSlotVisual": handleSetSlotVisual, // int32 i, string itemname // CookingStation.cs
  "RemoveDoneItem": handleNoop, // noop
  "CreateFragments": handleNoop, // noop // desctructible.cs
  "UseDoor": handleUseDoor, // bool forward, if zdo.ints["state"] == 0 then zdo.ints["state"] = forward ? 1 : -1 else zdo.ints["state"] = 0
  "Tap": handleNoop, // noop // fermenter.cs
  "AddItem": handleAddItem, // string itemName
  "AddFuel": handleNoop, // noop // fireplace.cs
  "RequestPickup": handleNoop(), // noop // fish.cs
  "Pickup": handleNoop, // noop // fish.cs
  "Nibble": handleNibble, // ZDOID fishId // fishingfloat.cs
  "Step": handleStep, // int32 stepeffect, vector3 point // step.cs
  "RequestOwn": handleNoop, // noop // ItemDrop.cs, ItemStand.cs, Vagon.cs
  "DropItem": handleNoop, // noop // ItemStand.cs
  "DestroyAttachment": handleNoop, // noop
  "SetVisualItem": handleSetVisualItem, // string prefabName, int32 variant
  "Hit": handleHit, // HitData hit, int32 areaIndex // MineRock.cs, there is also a MineRock5.cs that conflicts with damage lets hope that's not used
  "Hide": handleHide, // int32 areaIndex
  "SetPicked": handleSetPicked, // bool isPicked // Pickable.cs
  "Pick": handleNoop, // noop, // also in PickableItem.cs
  "OnDeath": handleNoop, // noop // Player.cs
  "UseStamina": handleUseStamina, // float v
  "Message": handleMessage, // int32 (MessageHud.MessageType) type, string message, int32 amount
  "OnTargeted": handleOnTargeted, // bool sensed, bool alerted
  "ToggleEnabled": handleToggleEnabled, // int64 playerId // PrivateArea.cs
  "TogglePermitted": handleTogglePermitted, // int64 playerId, string playerName
  "FlashShield": handleNoop, // noop
  "OnHit": handleNoop, // noop, Projectile.cs
  "AddStatusEffect": handleAddStatusEffect, // string name, bool resetTime // SEMan.cs
  "Rudder": handleRudder, // float rudderValue // Ship.cs,
  "Forward": handleNoop, // noop
  "Backward": handleNoop, // noop
  "Stop": handleNoop, // noop
  "RequestControl": handleRequestControl, // ZDOID playerId // ShipControlls.cs
  "RequestRespons": handleRequestResponse, // bool granted
  "ReleaseControl": handleReleaseControl, // ZDOID playerId
  "AddOre": handleAddOre, // string prefabName // Smelter.cs
  "EmptyProcessed": handleNoop, // noop
  "Say": handleSay, // int32 talkerType, string playerName, string text // Talker.cs
  "Command": handleCommand, // ZDOID user // Tameable.cs
  "SetTag": handleSetTag, // string text // TeleportWorld.cs (portal)
  "ApplyOperation": handleApplyOperation, // Zpackage: Vector3 position, TerrainOpSettings modifierSettings // TerrainComp.cs
  "Grow": handleNoop, // noop // TreeBase.cs
  "Shake": handleNoop, // noop
  "RequestDenied": handleNoop, // noop // Vagon.cs
  "WNTRepear": handleNoop, // noop // WearNTear.cs
  "WNTHealthChanged": handleWNTHealthChanged, // float health
  "WNTDamage": handleWNTDamage, // Hitdata hit
  "WNTRemove": handleNoop, // noop
  "WNTCreateFragments": handleNoop, // noop
  "SetTrigger": handleSetTrigger, // string name // ZSyncAnimation.cs
  "ChatMessage": handleChatMessage, // vector3 headPoint, int32(Talker.Type) type, string name, string message // Chat.cs
  "DamageText": handleDamageText, // ZPackage: int32(DamageText.TextType) type, vector3 pos, float dmg, boolean player // DamageText.cs
  "SleepStop": handleNoop, // noop // Game.cs
  "SleepStart": handleNoop, // noop
  "DiscoverClosestLocation": handleDiscoverClosestLocation, // string name, vector3 point, string pinName, int32 pintype
  "DiscoverLocationRespons": handleDiscoverLocationResponse, // string pinName, int32 pinType, vector3 position
  "Ping": handlePing, // float time
  "Pong": handlePong, // float time
  "ShowMessage": handleShowMessage, // int32 (MessageHud.MessageType) type, string text // MessageHud.cs
  "SetEvent": handleSetEvent, // string name, float time, vector3 position // RandEventSystem.cs
  "DestroyZDO": handleDestroyZDO, // ZPackage: int32 destroyListCount, ZDOID[] zdoIds // ZDOMan.cs
  "RequestZDO": handleRequestZDO, // ZDOId id
  "SpawnObject": handleSpawnObject, // vector3 position, vector3 rotation, int32 prefabHash // ZNetScene.cs
  "GlobalKeys": handleGlobalKeys, // StringList globalKeys // ZoneSystem.cs
  "LocationIcons": handleLocationIcons, // ZPackage: int32 locationCount, [vector3 key, string value][]
  "SetGlobalKey": handleSetGlobalKey, // string name
}

module.exports = async (rpcMethod, parameters) => {
  let reader = new ZPackage(parameters)

  if (handlers.hasOwnProperty(rpcMethod))
    return handlers[rpcMethod](reader)

  return null
}

function handleNoop() {
  return null
}

function handleOnNearProjectileHit(reader) {
  //vec3 center, float range, zdoId attacker, baseai.cs
  let center = reader.readVector3()
  let range = reader.readFloat()
  let zdoId = reader.readZDOId()

  return { center, range, zdoId }
}

function handleSetOwner(reader) {
  // int64 uid, string name, on beds
  let uid = reader.readInt64()
  let name = reader.readString()

  return { uid, name }
}

function handleHeal(reader) {
  // float hp, bool showText // character.cs
  let hp = reader.readFloat()
  let showText = reader.readBoolean()

  return { hp, showText }
}

function handleDamage(reader) {
  let hit = reader.readHitData()

  return { hit }
}

function handleStagger(reader) {
  let forceDirection = reader.readVector3()

  return { forceDirection }
}

function handleAddNoise(reader) {
  let range = reader.readFloat()

  return { range }
}

function handleSetTamed(reader) {
  let tamed = reader.readBoolean()

  return { tamed }
}

function handleRequestOpen(reader) {
  let playerId = reader.readInt64()

  return { playerId }
}

function handleOpenResponse(reader) {
  let opened = reader.readBoolean()

  return { opened }
}

function handleRequestTakeAll(reader) {
  let playerId = reader.readInt64()

  return { playerId }
}

function handleTakeAllResponse(reader) {
  let granted = reader.readBoolean()

  return { granted }
}

function handleSetSlotVisual(reader) {
  let slot = reader.readInt32()
  let itemName = reader.readString()

  return { slot, itemName }
}

function handleUseDoor(reader) {
  let forward = reader.readBoolean()

  return { forward }
}

function handleAddItem(reader) {
  let itemName = reader.readString()

  return { itemName }
}

function handleNibble(reader) {
  let fishId = reader.readZDOId()

  return { fishId }
}

function handleStep(reader) {
  let stepEffect = reader.readInt32()
  let point = reader.readVector3()

  return { stepEffect, point }
}

function handleSetVisualItem(reader) {
  let prefabName = reader.readString()
  let variant = reader.readInt32()

  return { prefabName, variant }
}

function handleHit(reader) {
  let hit = reader.readHitData()
  let areaIndex = reader.readInt32()

  return { hit, areaIndex }
}

function handleHide(reader) {
  let areaIndex = reader.readInt32()

  return { areaIndex }
}

function handleSetPicked(reader) {
  let isPicked = reader.readBoolean()

  return { isPicked }
}

function handleUseStamina(reader) {
  let v = reader.readFloat()

  return { stamina: v }
}

function handleMessage(reader) {
  let messageType = reader.readInt32()
  let message = reader.readString()
  let amount = reader.readInt32()

  const types = {
    1: "TopLeft",
    2: "Center"
  }

  if (types.hasOwnProperty(messageType))
    messageType = types[messageType]

  return { messageType, message, amount }
}

function handleOnTargeted(reader) {
  let sensed = reader.readBoolean()
  let alerted = reader.readBoolean()

  return { sensed, alerted }
}

function handleToggleEnabled(reader) {
  let playerId = reader.readInt64()

  return { playerId }
}

function handleTogglePermitted(reader) {
  let playerId = reader.readInt64()
  let playerName = reader.readString()

  return { playerId, playerName }
}

function handleAddStatusEffect(reader) {
  let name = reader.readString()
  let resetTime = reader.readBoolean()

  return { name, resetTime }
}

function handleRudder(reader) {
   let rudderValue = reader.readFloat()

  return { rudderValue }
}

function handleRequestControl(reader) {
  let playerId = reader.readZDOId()

  return { playerId }
}

function handleRequestResponse(reader) {
  let granted = reader.readBoolean()

  return { granted }
}

function handleReleaseControl(reader) {
  let playerId = reader.readZDOId()

  return { playerId }
}

function handleAddOre(reader) {
  let prefabName = reader.readString()

  return { prefabName }
}

function handleSay(reader) {
  let type = reader.readInt32()
  let playerName = reader.readString()
  let message = reader.readString()

  const types = {
    0: "Whisper",
    1: "Normal",
    2: "Shout",
    3: "Ping",
  }

  if (types.hasOwnProperty(type))
    type = types[type]

  return { type, playerName, message }
}

function handleCommand(reader) {
  let user = reader.readZDOId()

  return { user }
}

function handleSetTag(reader) {
  let text = reader.readString()

  return { text }
}

function handleApplyOperation(reader) {
  let pkg = new ZPackage(reader.readBuffer())

  let position = pkg.readVector3()
  let settings = pkg.readTerrainOpSettings()

  return { position, settings }
}

function handleWNTHealthChanged(reader) {
  let health = reader.readFloat()

  return { health }
}

function handleWNTDamage(reader) {
  let hit = reader.readHitData()

  return { hit }
}

function handleSetTrigger(reader) {
  let name = reader.readString()

  return { name }
}

function handleChatMessage(reader) {
  let headPoint = reader.readVector3()
  let type = reader.readInt32()
  let playerName = reader.readString()
  let message = reader.readString()

  const types = {
    0: "Whisper",
    1: "Normal",
    2: "Shout",
    3: "Ping",
  }

  if (types.hasOwnProperty(type))
    type = types[type]

  return { headPoint, type, playerName, message }
}

function handleDamageText(reader) {
  let pkg = new ZPackage(reader.readBuffer())

  let type = pkg.readInt32()
  let position = pkg.readVector3()
  let damage = pkg.readFloat()
  let player = pkg.readBoolean()

  const types = {
    0: "Normal",
    1: "Resistant",
    2: "Weak",
    3: "Immune",
    4: "Heal",
    5: "TooHard",
    6: "Blocked",
  }

  if (types.hasOwnProperty(type))
    type = types[type]

  return { type, position, damage, player }
}

function handleDiscoverClosestLocation(reader) {
  let name = reader.readString()
  let point = reader.readVector3()
  let pinName = reader.readString()
  let pinType = reader.readInt32()

  return { name, point, pinName, pinType }
}

function handleDiscoverLocationResponse(reader) {
  let pinName = reader.readString()
  let pinType = reader.readInt32()
  let position = reader.readVector3()

  return { pinName, pinType, position }
}

function handlePing(reader) {
  let time = reader.readFloat()

  return { time }
}

function handlePong(reader) {
  let time = reader.readFloat()

  return { time }
}

function handleShowMessage(reader) {
  let messageType = reader.readInt32()
  let message = reader.readString()

  const types = {
    1: "TopLeft",
    2: "Center"
  }

  if (types.hasOwnProperty(messageType))
    messageType = types[messageType]

  return { messageType, message }
}

function handleSetEvent(reader) {
  let name = reader.readString()
  let time = reader.readFloat()
  let position = reader.readVector3()

  return { name, time, position }
}

function handleDestroyZDO(reader) {
  let pkg = new ZPackage(reader.readBuffer())

  let count = pkg.readInt32()
  let zdoIds = []

  for (let i = 0; i < count; i++)
    zdoIds.push(pkg.readZDOId())

  return { zdoIds }
}

function handleRequestZDO(reader) {
  let id = reader.readZDOId()

  return { id }
}

function handleSpawnObject(reader) {
  let position = reader.readVector3()
  let rotation = reader.readVector3()
  let prefabHash = reader.readString()

  return { position, rotation, prefabHash }
}

function handleGlobalKeys(reader) {
  let globalKeys = reader.readStringList()

  return { globalKeys }
}

function handleLocationIcons(reader) {
  let pkg = new ZPackage(reader.readBuffer())

  let count = pkg.readInt32()
  let locationIcons = []

  for (let i = 0; i < count; i++)
    locationIcons.push({
      position: pkg.readVector3(),
      name: pkg.readString()
    })

  return { locationIcons }
}

function handleSetGlobalKey(reader) {
  let name = reader.readString()

  return { name }
}