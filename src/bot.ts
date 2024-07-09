import * as fs from 'node:fs'
import path from 'node:path'

import { create, SocketState, Whatsapp } from '@wppconnect-team/wppconnect'

import { systemInfo } from './system.js'
import { logger } from './utils/logger.js'
import { fileURLToPath } from 'node:url'

export const SESSION_NAME = 'wpp_ai'
export const PREFIXES = ['!', '/', '#', '$']

const commands = new Map<string, (client: Whatsapp, message: any) => Promise<void>>()
const dirname = path.dirname(fileURLToPath(import.meta.url))

const resolveCommandsPath = () => {
  const isCompiled = dirname.includes('/build/')
  return isCompiled ? path.resolve(dirname, './commands') : path.resolve(dirname, '../commands')
}

const loadCommands = async () => {
  const commandsPath = resolveCommandsPath()
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
  for (const file of commandFiles) {
    const commandModule = await import(`${commandsPath}/${file}`)
    const commandName = file.split('.')[0]
    commands.set(commandName, commandModule.execute)
  }
}

export const Bot = async () => {
  await loadCommands()

  create({
    session: SESSION_NAME,
    disableWelcome: true,
  }).then((client) => start(client))
}

const start = async (client: Whatsapp) => {
  client.onStateChange((state: SocketState) => {
    if (state === SocketState.CONFLICT) client.useHere()

    if (state === SocketState.UNPAIRED) {
      logger.info(`bot with session name ${SESSION_NAME} is unpaired`)
    }
    if (state === SocketState.CONNECTED)
      logger.info(`bot with session name ${SESSION_NAME} is connected`)
  })

  client.onReactionMessage((react: any) => {
    logger.info(`reaction message: ${react}`)
  })

  client.onMessage(async (message) => {
    if (!message.body) return

    if (message.body === 'Hi') {
      await client.sendText(message.from, systemInfo())
    }

    if (PREFIXES.some((prefix) => message.body!.startsWith(prefix))) {
      const command = message.body!.toLowerCase().trim().slice(1).split(' ')[0]
      if (commands.has(command)) {
        await commands.get(command)!(client, message)
      } else {
        await client.sendText(message.from, 'command not found')
      }
    }
  })
}
