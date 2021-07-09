const fs = require('fs')
const readline = require('readline')

module.exports = async (basePath) => {
  let prefabs = fs.readdirSync(basePath)

  let componentToPrefab = {}
  let prefabMap = {}

  for (const file of prefabs) {
    if (file.includes('.meta'))
      continue

    const fileStream = fs.createReadStream(basePath + file);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    let prefabName = null
    let components = []
    let componentNames = []

    let nextLineComponentType = false
    let nextLineScript = false

    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.

      if (nextLineScript) {
        if (line.includes('m_Script')) {
          let firstSplit = line.split('guid: ')
          let secondSplit = firstSplit[1].split(',')
          let scriptGuid = secondSplit[0]

          componentNames.push('MonoBehaviour (' + scriptGuid + ')')
          if (!componentToPrefab.hasOwnProperty(scriptGuid))
            componentToPrefab[scriptGuid] = [ prefabName ]
          else
            componentToPrefab[scriptGuid].push(prefabName)
        }
      }
      else if (nextLineComponentType) {
        let componentType = line.substr(0, line.length - 1)
        nextLineComponentType = false

        if (componentType === 'MonoBehaviour')
          nextLineScript = true
        else
          componentNames.push(componentType)
      }
      else {
        if (line.includes('m_Name')) {
          let split = line.split(': ')

          prefabName = split[1]

          console.log("File (" + file + ") Prefab name:", split[1])
        } else if (line.includes(' - component: ') && prefabName === null) {
          let split = line.split('fileID: ')

          console.log("File (" + file + ") Component ID:", split[1].substr(0, split[1].length - 1))

          components.push(split[1].substr(0, split[1].length - 1))
        } else if (line.startsWith('--- !u!')) {
          let componentId = line.split('&')
          if (components.includes(componentId[1]))
            nextLineComponentType = true
        }
      }
    }

    prefabMap[prefabName] = {
      name: prefabName,
      components: componentNames
    }
  }

  let componentGuids = {
    "1f3ddc83de9b99d42b095a2c96fe47ee": "SpawnSystem"
  }

  return {
    prefabs: prefabMap,
    components: componentToPrefab,
  }
}
