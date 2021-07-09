module.exports.messages = []

module.exports.log = (direction, rpcHash, rpcMethod, message) => {
  if (rpcMethod !== 'ZDOData')
  module.exports.messages.push({
    direction,
    rpcHash,
    rpcMethod,
    time: new Date().toISOString(),
    message
  })
}