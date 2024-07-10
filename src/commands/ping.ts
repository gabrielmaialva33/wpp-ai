import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export const ping = {
  name: 'ping',
  description: 'veja se o bot está online',
  execute: async (client: Whatsapp, message: Message) => {
    await client.sendText(message.from, `Pong! 🏓`, { quoted: message })
  },
}
