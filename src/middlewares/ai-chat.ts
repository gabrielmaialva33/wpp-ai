import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { Env, NAMES, PREFIXES } from '../env.js'

import { Context, StringUtils, History } from '../utils/index.js'
import { AI } from '../plugins/openai.plugin.js'

export const execute = async (client: Whatsapp, message: Message) => {
  if (message.type !== MessageType.CHAT) return
  if (!message.body) return
  if (StringUtils.isCommand(PREFIXES, message.body)) return

  const context = await Context.get(client, message)

  if (StringUtils.includes(message.body, NAMES)) {
    const input = `${context.user.username}(${Env.BOT_NAME}):||${context.text}||\n`

    await client.startTyping(message.from, 4000)

    const response = await AI.complete(input, context.user.username)

    // @ts-ignore
    if (response.choices.length === 0 || !response.choices[0].text) return

    // @ts-ignore
    const choices = response.choices
    const random = Math.floor(Math.random() * choices.length)
    const output = choices[random].text

    const history = History.build(input, output, context.user.username)
    History.write(history)

    return client.sendText(message.from, output, { quotedMsg: message.id })
  }

  // check if the message is a reply
  if (message.quotedMsgId) {
    const quotedMessage = await client.getMessageById(message.quotedMsgId)
    const WID = await client.getWid()

    if (quotedMessage.sender.id._serialized === WID) {
      const input = `${context.user.username}(${Env.BOT_NAME}):||${context.text}||\n`

      await client.startTyping(message.from, 2000)

      const response = await AI.complete(input, context.user.username)

      // @ts-ignore
      if (response.choices.length === 0 || !response.choices[0].text) return
      // @ts-ignore
      const choices = response.choices
      const random = Math.floor(Math.random() * choices.length)
      const output = choices[random].text

      const history = History.buildReply(input, output, context.user.username)
      History.write(history)

      return client.sendText(message.from, output, { quotedMsg: message.id })
    }
  }
}
