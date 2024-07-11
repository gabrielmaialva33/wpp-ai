import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { Context } from '../utils/context.js'

export const execute = async (client: Whatsapp, message: Message) => {
  const c = await Context.get(client, message)

  console.log(c)

  //const from = message.from

  // send a reply to the user
  //await client.sendText(from, `reading your message...`)
}
