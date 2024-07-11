import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { PREFIXES } from '../bot.js'
import { History, Context, String } from '../utils/index.js'

export const execute = async (client: Whatsapp, message: Message) => {
  console.log('chat middleware', message.type)
  // only write if message is a chat
  if (message.type !== MessageType.CHAT) return

  // is command message
  if (String.isCommand(PREFIXES, message.body)) return

  const context = await Context.get(client, message)
  const history = History.buildChat(context)
  History.write(history)
}
