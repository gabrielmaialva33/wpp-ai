import os from 'node:os'

const platform = os.platform()
const arch = os.arch()
const release = os.release()
const cpus = os.cpus()
const totalmem = os.totalmem()
const freemem = os.freemem()
const hostname = os.hostname()
const uptime = os.uptime()
const userInfo = os.userInfo()

export function systemInfo() {
  return `
    *System Information:*

    • platform: ${platform}
    • arch: ${arch}
    • release: ${release}
    • cpus: ${cpus.length}
    • totalmem: ${Math.floor(totalmem / 1024 / 1024 / 1024)} GB
    • freemem: ${Math.floor((freemem / totalmem) * 100)} GB
    • hostname: ${hostname}
    • uptime: ${Math.floor(uptime / 60 / 60)} hours
    • user: ${userInfo.username}

    *Node.js Information:*

    • version: ${process.version}
    • pid: ${process.pid}
    • platform: ${process.platform}
    • uptime: ${Math.floor(process.uptime() / 60 / 60)} hours
  `
}
