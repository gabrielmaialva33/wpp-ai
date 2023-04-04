import { create, Whatsapp } from '@wppconnect-team/wppconnect'
import * as console from 'console'

export const Bot = async () =>
  create({
    session: 'afonsa_ai',
    disableWelcome: true,
  }).then((client) => start(client))

const start = async (client: Whatsapp) => {
  client.onMessage(async (message) => {
    const sender = await client.getContact(message.author)
    console.log(sender)
  })
}
