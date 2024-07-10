import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { getCommandsList } from '../bot.js'

export const help = {
  name: 'help',
  description: 'list comandos disponíveis',
  execute: async (client: Whatsapp, message: Message) => {
    const commandsList = getCommandsList()
    let response = 'Lista de comandos disponíveis:\n\n'

    commandsList.forEach((command) => {
      response += `*${command.name}*: ${command.description}\n`
    })

    await client.sendText(message.from, response)
  },
}
