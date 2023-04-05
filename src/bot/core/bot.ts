import { create, Whatsapp } from '@wppconnect-team/wppconnect'
import { ChatMiddleware } from '@/bot/middlewares/chat.middleware'

export const Bot = async () =>
  create({
    session: 'afonsa_ai',
    disableWelcome: true,
  }).then((client) => start(client))

const start = async (client: Whatsapp) => {
  client.onMessage(async (message) => {
    await Promise.all([ChatMiddleware(client, message)])
  })
}
