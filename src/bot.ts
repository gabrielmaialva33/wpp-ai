import * as fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { create, SocketState, Whatsapp } from '@wppconnect-team/wppconnect'

import { Logger } from './utils/logger.js'
import { Env, PREFIXES } from './env.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const middlewares = new Map<string, (client: Whatsapp, message: any) => Promise<void>>()
const commands = new Map<
  string,
  { execute: (client: Whatsapp, message: any) => Promise<void>; description: string }
>()

const resolvePath = (file: string) => {
  const isCompiled = dirname.includes('/build/')
  return isCompiled ? path.resolve(dirname, `./${file}`) : path.resolve(dirname, `../${file}`)
}

const loadCommands = async () => {
  const commandsPath = resolvePath('commands')
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))

  for (const file of commandFiles) {
    const commandModule = await import(`${commandsPath}/${file}`)
    const commandName = file.split('.')[0]
    if (commandModule[commandName] && commandModule[commandName].name) {
      commands.set(commandModule[commandName].name, {
        execute: commandModule[commandName].execute,
        description: commandModule[commandName].description,
      })
    }
  }
}

const loadMiddlewares = async () => {
  const middlewaresPath = resolvePath('middlewares')
  const middlewareFiles = fs
    .readdirSync(middlewaresPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))

  for (const file of middlewareFiles) {
    const middlewareModule = await import(`${middlewaresPath}/${file}`)
    const middlewareName = file.split('.')[0]
    middlewares.set(middlewareName, middlewareModule.execute)
  }
}

export const Bot = async () => {
  await loadCommands()
  await loadMiddlewares()

  // create a new session
  create({
    session: Env.WPP_SESSION,
    disableWelcome: true,
  })
    .then((client) => start(client))
    .catch((e) => Logger.error(e))
}

const start = async (client: Whatsapp) => {
  client.onStateChange((state: SocketState) => {
    if (state === SocketState.CONFLICT) client.useHere()

    if (state === SocketState.UNPAIRED) {
      Logger.info(`bot with session name ${Env.WPP_SESSION} is unpaired`)
    }
    if (state === SocketState.CONNECTED)
      Logger.info(`bot with session name ${Env.WPP_SESSION} is connected`)
  })

  client.onReactionMessage((react: any) => {
    console.log(react)
    Logger.info(`reaction message`)
  })

  client.onMessage(async (message) => {
    if (!message.body) return

    // execute middlewares
    await Promise.all(
      [...middlewares.values()].map((middleware) => middleware(client, message))
    ).catch((e) => Logger.error(e))

    if (PREFIXES.some((prefix) => message.body!.startsWith(prefix))) {
      const command = message.body!.toLowerCase().trim().slice(1).split(' ')[0]
      if (commands.has(command)) {
        await commands.get(command)!.execute(client, message)
      } else {
        await client.sendText(message.from, 'command not found')
      }
    }
  })
}

export const getCommandsList = () => {
  return Array.from(commands.entries()).map(([name, { description }]) => ({ name, description }))
}
