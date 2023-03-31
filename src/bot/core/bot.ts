import { create, Whatsapp } from '@wppconnect-team/wppconnect'

export const Bot = async () =>
  create({
    session: 'afonsa_ai',
  }).then((client) => start(client))

const start = async (client: Whatsapp) => {
  client.onMessage(async (message) => {
    console.log(message)
  })
}
