import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { Context } from '../utils/context.js'

export const execute = async (client: Whatsapp, message: Message) => {
  const context = await Context.getContext(client, message)

  console.log(context)

  const from = message.from

  // send a reply to the user
  await client.sendText(from, `reading your message...`)
}
