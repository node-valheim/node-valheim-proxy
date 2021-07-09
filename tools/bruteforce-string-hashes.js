require('node-valheim-core')

const cluster = require("cluster")
const os = require("os")

let hashesToFind = [
  126113533,
  131714725,
  308937392,
  376260493,
  1006110740,
  1477814303,
  1518790972,
  1588765240,
  1898526437,
  -743733863,
  -333538371,
  -333538366,
  -1210092380,
  -559973201,
  -1623666139,
  -1615272148,
  -315164837,
]

let found = {}

let maxLength = 6

let language = "abcdefghijklmnopqrstuvwxyzABDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  let i = 0;

  cluster.on('exit', (worker, code, signal) => {
    console.log('worker %d died (%s).', worker.id, signal || code);
  });

  while (i < numCPUs) {
    let worker = cluster.fork();

    i++;
  }

  masterMain();
} else {
  workerMain();
}

async function masterMain() {
  cluster.on('message', (worker, message) => {
    if (message.hasOwnProperty('string')) {
      if (!found.hasOwnProperty(message.hash))
        found[message.hash] = []

      found[message.hash].push(message.string)

      let missing = 0
      let currentFound = Object.keys(found)

      for (let hash of hashesToFind)
        if (!currentFound.includes('' + hash))
          missing++

      console.log("possible hash found (" + message.string + " = " + message.hash + "), " + missing + " left to find")
      console.log(found)
    }
  })

  const workerIds = Object.keys(cluster.workers);

  let segmentLength = (language.length - (language.length % workerIds.length)) / workerIds.length;
  let extra = language.length % workerIds.length;

  for (let i = 0; i < workerIds.length; i++) {
    let segment = language.slice(segmentLength * i + (i < extra ? i : extra), (i === workerIds.length - 1) ? undefined : segmentLength * (i + 1) + (i < extra ? i : extra) + (i < extra ? 1 : 0));

    cluster.workers[workerIds[i]].send({
      message: "start",
      segment
    })
  }
}

async function workerMain() {
  let segment

  function startHashing() {
    for (let i = 0; i < segment.length; i++) {
      console.log("worker " + cluster.worker.id + " searching hashes starting with", segment[i])
      searchHashes(segment[i])
    }
  }

  function searchHashes(prefix) {
    if (prefix.length >= maxLength)
      return

    for (let i = 0; i < language.length; i++) {
      let substring = prefix + language[i]

      if (hashesToFind.includes(substring.getStableHashCode())) {
        console.log("worker " + cluster.worker.id + " found string! ", substring, substring.getStableHashCode())

        process.send({
          message: "Hash found! " + substring + " = " + substring.getStableHashCode(),
          string: substring,
          hash: substring.getStableHashCode()
        })
      }

      searchHashes(substring)
    }
  }

  process.on('message', (msg) => {
    if (msg.message === 'start') {
      segment = msg.segment
      startHashing()
    }
  })
}