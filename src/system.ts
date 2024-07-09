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
    Your system:
    - platform: ${platform}
    - arch: ${arch}
    - release: ${release}
    - cpus: ${cpus.length}
    - totalmem: ${totalmem / 1024 / 1024 / 1024} GB
    - freemem: ${freemem / 1024 / 1024 / 1024} GB
    - hostname: ${hostname}
    - uptime: ${Math.floor(uptime / 60 / 60)} hours
    - user: ${userInfo.username}
  `
}
