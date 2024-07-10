import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export const execute = async (client: Whatsapp, message: Message) => {
  // get the message from the user
  const from = message.from

  // send a reply to the user
  await client.sendText(from, `from: ${from}`, { quoted: message })
}
