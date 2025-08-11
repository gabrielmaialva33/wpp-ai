import * as fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { create, SocketState, Whatsapp } from '@wppconnect-team/wppconnect'

import { Logger } from './utils/logger.js'
import { Env, PREFIXES } from './env.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const middlewares = new Map<string, (client: Whatsapp, message: any) => Promise<void>>()

// Enhanced command storage with full metadata
interface StoredCommand {
  name: string
  execute: (client: Whatsapp, message: any) => Promise<void>
  description: string
  aliases?: string[]
  usage?: string
  category?: string
}

const commands = new Map<string, StoredCommand>()
const commandAliases = new Map<string, string>() // Maps alias to command name

// const resolvePath = (file: string) => {
//   const isCompiled = dirname.includes('/build/')
//   return isCompiled ? path.resolve(dirname, `./${file}`) : path.resolve(dirname, `../${file}`)
// }

const resolvePath = (file: string) => {
  const isCompiled = dirname.includes('/build/')
  return isCompiled ? path.resolve(dirname, `../src/${file}`) : path.resolve(dirname, file)
}

const loadCommands = async () => {
  const commandsPath = resolvePath('commands')
  console.log(`Commands path: ${commandsPath}`)
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))

  for (const file of commandFiles) {
    const commandModule = await import(`${commandsPath}/${file}`)
    const commandName = file.split('.')[0]
    if (commandModule[commandName] && commandModule[commandName].name) {
      const cmd = commandModule[commandName]

      // Store full command with metadata
      const storedCommand: StoredCommand = {
        name: cmd.name,
        execute: cmd.execute,
        description: cmd.description,
        aliases: cmd.aliases,
        usage: cmd.usage,
        category: cmd.category,
      }

      commands.set(cmd.name, storedCommand)

      // Register aliases
      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          commandAliases.set(alias, cmd.name)
        }
      }
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
    puppeteerOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=TrustedDOMTypes',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    },
  }).then((client) => start(client))
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
      const commandText = message.body!.toLowerCase().trim().slice(1).split(' ')[0]

      // Check direct command or alias
      let command = commands.get(commandText)
      if (!command && commandAliases.has(commandText)) {
        const actualCommandName = commandAliases.get(commandText)!
        command = commands.get(actualCommandName)
      }

      if (command) {
        await command.execute(client, message)
      } else {
        // Command not found - you can uncomment to notify user
        // await client.sendText(message.from, `❌ Comando "${commandText}" não encontrado. Use !help para ver os comandos disponíveis.`)
      }
    }
  })
}

// Export function to get all commands with full metadata
export const getAllCommands = (): StoredCommand[] => {
  return Array.from(commands.values())
}

// Legacy function for backward compatibility
export const getCommandsList = () => {
  return Array.from(commands.entries()).map(([name, cmd]) => ({
    name,
    description: cmd.description,
  }))
}

// Get specific command by name or alias
export const getCommand = (nameOrAlias: string): StoredCommand | undefined => {
  // Try direct name first
  let command = commands.get(nameOrAlias.toLowerCase())

  // If not found, try alias
  if (!command && commandAliases.has(nameOrAlias.toLowerCase())) {
    const actualCommandName = commandAliases.get(nameOrAlias.toLowerCase())!
    command = commands.get(actualCommandName)
  }

  return command
}
