import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { getCommandsList } from '../bot.js'

export const help = {
  name: 'help',
  description: 'comandos disponíveis',
  execute: async (client: Whatsapp, message: Message) => {
    const commandsList = getCommandsList()
    let response = '*Comandos disponíveis*:\n\n'

    commandsList.forEach((command) => {
      response += `\`${command.name}\`: \`\`\`${command.description}\`\`\`\n\n`
    })

    await client.sendText(message.from, response, { quotedMsg: message.id })
  },
}
