import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { History } from '../utils/history.js'
import { Context } from '../utils/context.js'
import { Logger } from '../utils/logger.js'

import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

export const execute = async (client: Whatsapp, message: Message) => {
  Logger.info(`message.type: ${message.type}`)

  // only write if message is a chat
  if (message.type !== MessageType.CHAT) return

  const context = await Context.get(client, message)
  const history = History.buildChat(context)
  History.write(history)
}
