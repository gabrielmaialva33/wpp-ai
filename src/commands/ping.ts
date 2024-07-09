import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export const execute = async (client: Whatsapp, message: Message) => {
  await client.sendText(message.from, `Pong! 🏓`, { quoted: message })
}
