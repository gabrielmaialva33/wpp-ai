import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { History, Context, StringUtils } from '../utils/index.js'
import { PREFIXES } from '../env.js'

export const execute = async (client: Whatsapp, message: Message) => {
  if (message.type !== MessageType.CHAT) return
  if (StringUtils.isCommand(PREFIXES, message.body)) return

  if (message.quotedMsgId) {
    const quotedMessage = await client.getMessageById(message.quotedMsgId)
    const WID = await client.getWid()
    // @ts-ignore
    if (quotedMessage.sender.id._serialized === WID) return
  }

  const context = await Context.get(client, message)
  const history = History.buildChat(context)
  History.write(history)
}
