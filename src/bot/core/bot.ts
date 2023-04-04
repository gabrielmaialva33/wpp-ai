import { create, Whatsapp } from '@wppconnect-team/wppconnect'
import * as console from 'console'

export const Bot = async () =>
  create({
    session: 'afonsa_ai',
    disableWelcome: true,
  }).then((client) => start(client))

const start = async (client: Whatsapp) => {
  const contacts = await client.getAllContacts()
  console.log(contacts)
}
