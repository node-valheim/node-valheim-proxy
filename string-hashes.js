require('node-valheim-core')
const fs = require('fs');
const loadPrefabs = require('./tools/generate-prefab-names')

let cache = null

async function loadPrefapHashMap(basePath = '/Volumes/BOOTCAMP/Users/Jonyleeson/Desktop/sharedassets4.assets/Assets/PrefabInstance/') {
  let saved
  let prefabHashMap = {}

  if (fs.existsSync('./prefab-hashes.json')) {
    saved = JSON.parse(fs.readFileSync('./prefab-hashes.json'))

    for (const prefab in saved.prefabs)
      prefabHashMap[prefab.getStableHashCode()] = prefab
  }
  else {
    saved = await loadPrefabs(basePath)

    fs.writeFileSync('./prefab-hashes.json', JSON.stringify(saved))

    for (const prefab in saved.prefabs)
      prefabHashMap[prefab.getStableHashCode()] = prefab
  }

  return { prefabs: prefabHashMap, spawners: saved.components['1f3ddc83de9b99d42b095a2c96fe47ee'] }
}

module.exports = async () => {
  if (cache !== null)
    return cache

  let rpcs = [
    'ServerHandshake',
    'ClientHandshake',
    'ZDOData',
    'PeerInfo',
    'Disconnect',
    'Error',
    'RefPos',
    'PlayerList',
    'RemotePrint',
    'CharacterID',
    'Kick',
    'Ban',
    'Unban',
    'Save',
    'PrintBanned',
    'NetTime',
    'RoutedRPC',
  ]

  let rpcHashMap = {}

  for (const rpc of rpcs)
    rpcHashMap[rpc.getStableHashCode()] = rpc

  let routedRpcs = [
    "OnNearProjectileHit", // vec3 center, float range, zdoId attacker, baseai.cs
    "Alert", // noop, baseai.cs
    "SetOwner", // int64 uid, string name, on beds
    "Extract", // noop, on beehives
    "Heal", // float hp, bool showText // character.cs
    "Damage", // HitData // also on desctructible.cs, TreeBase.cs, TreeLog.cs
    "Stagger", // vector3 forcedirection
    "AddNoise", // float range
    "ResetCloth", // noop
    "SetTamed", // bool tamed
    "RequestOpen", // int64 playerId // container.cs
    "OpenRespons", // bool opened
    "RequestTakeAll", // int64 playerId
    "TakeAllRespons", // bool opened
    "SetSlotVisual", // int32 i, string itemname // CookingStation.cs
    "RemoveDoneItem", // noop
    "AddItem", // string itemName (the remove from inv seems to be client sided i guess this is hackable)
    "CreateFragments", // noop // desctructible.cs
    "UseDoor", // bool forward, if zdo.ints["state"] == 0 then zdo.ints["state"] = forward ? 1 : -1 else zdo.ints["state"] = 0
    "Tap", // noop // fermenter.cs
    "AddItem", // string itemName
    "AddFuel", // noop // fireplace.cs
    "RequestPickup", // noop // fish.cs
    "Pickup", // noop // fish.cs
    "Nibble", // ZDOID fishId // fishingfloat.cs
    "Step", // int32 stepeffect, vector3 point // step.cs
    "RequestOwn", // noop // ItemDrop.cs, ItemStand.cs, Vagon.cs
    "DropItem", // noop // ItemStand.cs
    "DestroyAttachment", // noop
    "SetVisualItem", // string prefabName, int32 variant
    "Hit", // HitData hit, int32 areaIndex // MineRock.cs, there is also a MineRock5.cs that conflicts with damage lets hope that's not used
    "Hide", // int32 areaIndex
    "SetPicked", // bool isPicked // Pickable.cs
    "Pick", // noop, // also in PickableItem.cs
    "OnDeath", // boop // Player.cs
    "UseStamina", // float v
    "Message", // int32 (MessageHud.MessageType) type, string message, int32 amount
    "OnTargeted", // bool sensed, bool alerted
    "ToggleEnabled", // int64 playerId // PrivateArea.cs
    "TogglePermitted", // int64 playerId, string playerName
    "FlashShield", // noop
    "OnHit", // noop, Projectile.cs
    "AddStatusEffect", // string name, bool resetTime // SEMan.cs
    "Rudder", // float rudderValue // Ship.cs,
    "Forward", // noop
    "Backward", // noop
    "Stop", // noop
    "RequestControl", // ZDOID playerId // ShipControlls.cs
    "RequestRespons", // bool granted
    "ReleaseControl", // ZDOID playerId
    "AddOre", // string prefabName // Smelter.cs
    "EmptyProcessed", // noop
    "AddFuel", // noop
    "Say", // int32 talkerType, string playerName, string text // Talker.cs
    "Command", // ZDOID user // Tameable.cs
    "SetTag", // string text // TeleportWorld.cs (portal)
    "ApplyOperation", // Zpackage: Vector3 position, TerrainOpSettings modifierSettings // TerrainComp.cs
    "Grow", // noop // TreeBase.cs
    "Shake", // noop
    "RequestDenied", // noop // Vagon.cs
    "WNTRepear", // noop // WearNTear.cs
    "WNTHealthChanged", // float health
    "WNTDamage", // Hitdata hit
    "WNTRemove", // noop
    "WNTCreateFragments", // noop
    "SetTrigger", // string name // ZSyncAnimation.cs
    "ChatMessage", // vector3 headPoint, int32(Talker.Type) type, string name, string message // Chat.cs
    "DamageText", // ZPackage: int32(DamageText.TextType) type, vector3 pos, float dmg, boolean player // DamageText.cs
    "SleepStop", // noop // Game.cs
    "SleepStart", // noop
    "DiscoverClosestLocation", // string name, vector3 point, string pinName, int32 pintype
    "DiscoverLocationRespons", // string pinName, int32 pinType, vector3 position
    "Ping", // float time
    "Pong", // float time
    "ShowMessage", // int32 (MessageHud.MessageType) type, string text // MessageHud.cs
    "SetEvent", // string name, float time, vector3 position // RandEventSystem.cs
    "DestroyZDO", // ZPackage: int32 destroyListCount, ZDOID[] zdoIds // ZDOMan.cs
    "RequestZDO", // ZDOId id
    "SpawnObject", // vector3 position, vector3 rotation, int32 prefabHash // ZNetScene.cs
    "GlobalKeys", // StringList globalKeys // ZoneSystem.cs
    "LocationIcons", // ZPackage: int32 locationCount, [vector3 key, string value][]
    "SetGlobalKey", // string name
  ]

  let routedRpcHashMap = {}

  for (const routedRpc of routedRpcs)
    routedRpcHashMap[routedRpc.getStableHashCode()] = routedRpc

  let properties = [
    "accTime",
    "addedDefaultItems",
    "alert",
    "alive_time",
    "bakeTimer",
    "baseValue",
    "BeardItem",
    "body_avel",
    "body_vel",
    "BodyVelocity",
    "CatchID",
    "ChestItem",
    "Content",
    "crafterID",
    "crafterName",
    "creatorName",
    "dead",
    "DebugFly",
    "DespawnInDay",
    "dodgeinv",
    "done",
    "drops",
    "durability",
    "emote",
    "emote_oneshot",
    "emoteID",
    "enabled",
    "EventCreature",
    "forward",
    "fuel",
    "HairColor",
    "HairItem",
    "haveTarget",
    "health",
    "HelmetItem",
    "Hue",
    "huntplayer",
    "inBed",
    "InitVel",
    "InUse",
    "inWater",
    "IsBlocking",
    "item",
    "itemPrefab",
    "items",
    "itemStack",
    "landed",
    "lastTime",
    "lastWorldTime",
    "LeftBackItem",
    "LeftBackItemVariant",
    "LeftItem",
    "LeftItemVariant",
    "LegItem",
    "level",
    "location",
    "LookTarget",
    "lovePoints",
    "max_health",
    "ModelIndex",
    "noise",
    "owner",
    "ownerName",
    "parentID_u",
    "parentID_i",
    "patrol",
    "patrolPoint",
    "permitted",
    "picked",
    "picked_time",
    "plantTime",
    "playerID",
    "playerName",
    "pregnant",
    "product",
    "pvp",
    "quality",
    "queued",
    "relPos",
    "RightBackItem",
    "RightItem",
    "RodOwner",
    "rooms",
    "rudder",
    "Saturation",
    "scale",
    "seAttrib",
    "seed",
    "ShoulderItem",
    "ShoulderItemVariant",
    "SkinColor",
    "sleeping",
    "spawn_id",
    "spawn_time",
    "SpawnAmount",
    "SpawnOre",
    "SpawnPoint",
    "spawnpoint",
    "SpawnTime",
    "spawntime",
    "stack",
    "stamina",
    "StartTime",
    "state",
    "Stealth",
    "support",
    "tag",
    "tamed",
    "TameLastFeeding",
    "TameTimeLeft",
    "TCData",
    "text",
    "tiltrot",
    "timeOfDeath",
    "user",
    "UtilityItem",
    "Value",
    "variant",
    "vel",
    "wakeup",
  ]

  let prefabs = await loadPrefapHashMap()

  let spawners = [
    'army_eikthyr',
    'army_theelder',
    'army_bonemass',
    'army_moder',
    'army_goblin',
    'wolves',
    'skeletons',
    'blobs',
    'foresttrolls',
    'surtlings',
    'boss_eikthyr',
    'boss_bonemass',
    'boss_gdking',
    'boss_goblinking',
  ]
  let spawnerProperties = []

  for (const spawner in prefabs.prefabs) {
    spawnerProperties = spawnerProperties.concat([
      "e_" + prefabs.prefabs[spawner],
      "b_" + prefabs.prefabs[spawner],
    ])
  }

  for (let i = 0; i < 256; i++) {
    properties = properties.concat([
      "drop_amount" + i,
      "drop_hash" + i,
      "item" + i,
      "room" + i,
      "room" + i + "_pos",
      "room" + i + "_rot",
      "pu_id" + i,
      "pu_name" + i,
      "slot" + i,
    ], spawnerProperties.map(property => property + i))
  }

  properties = properties.concat(properties.map(property => property + "_u"), properties.map(property => property + "_i"))

  let propertiesHashMap = {}

  for (const property of properties)
    propertiesHashMap[property.getStableHashCode()] = property

  propertiesHashMap[402913258] = "alert"
  propertiesHashMap[-663230492] = "attach_bed"
  propertiesHashMap[1252953157] = "attach_chair"
  propertiesHashMap[524979580] = "blocking"
  propertiesHashMap[513754048] = "crafting"
  propertiesHashMap[70500473] = "crouching"
  propertiesHashMap[-23605810] = "encumbered"
  propertiesHashMap[-50949212] = "equipping"
  propertiesHashMap[23215934] = "flapping"
  propertiesHashMap[-1489121593] = "forward_speed"
  propertiesHashMap[437024329] = "intro"
  propertiesHashMap[1299391946] = "inWater"
  propertiesHashMap[-1493684636] = "onGround"
  propertiesHashMap[-1344031744] = "sideway_speed"
  propertiesHashMap[110664935] = "sleeping"
  propertiesHashMap[1546011855] = "statef"
  propertiesHashMap[-861454496] = "statei"
  propertiesHashMap[-1488745797] = "turn_speed"
  propertiesHashMap[1477933170] = "anim_speed"

  cache = {
    rpcs: rpcHashMap,
    routedRpcs: routedRpcHashMap,
    prefabs: prefabs.prefabs,
    properties: propertiesHashMap,
  }

  return cache
}