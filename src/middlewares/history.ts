import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { History } from '../utils/history.js'
import { Context } from '../utils/context.js'

export const execute = async (client: Whatsapp, message: Message) => {
  const context = await Context.get(client, message)
  const history = History.buildChat(context)
  History.write(history)
}
