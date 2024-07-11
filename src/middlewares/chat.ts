import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { PREFIXES } from '../bot.js'
import { Env } from '../env.js'

import { Context, String, History } from '../utils/index.js'
import { AI } from '../plugins/openai.plugin.js'

export const execute = async (client: Whatsapp, message: Message) => {
  if (message.type !== MessageType.CHAT) return
  if (String.isCommand(PREFIXES, message.body)) return
  if (!message.body) return

  const context = await Context.get(client, message)

  if (String.include(message.body, Env.BOT_NAME)) {
    const input = `${context.user.username}(${Env.BOT_NAME}):|${context.text}|\n`

    await client.startTyping(message.from, 2000)

    const response = await AI.complete(input, context.user.username)

    // @ts-ignore
    if (response.choices.length === 0 || !response.choices[0].text) return

    // @ts-ignore
    const choices = response.choices
    const random = Math.floor(Math.random() * choices.length)
    const output = choices[random].text

    const history = History.build(input, output, context.user.name)
    History.write(history)

    return client.sendText(message.from, output, { quotedMsg: message.id })
  }

  // check if the message is a reply
  if (message.quotedMsgId) {
    const quotedMessage = await client.getMessageById(message.quotedMsgId)
    const WID = await client.getWid()

    if (quotedMessage.sender.id._serialized === WID) {
      console.log('quotedMessage from bot')

      const input = `${context.user.username}(${Env.BOT_NAME}):|${context.text}|\n`

      await client.startTyping(message.from, 2000)

      const response = await AI.complete(input, context.user.username)

      // @ts-ignore
      if (response.choices.length === 0 || !response.choices[0].text) return

      // @ts-ignore
      const choices = response.choices
      const random = Math.floor(Math.random() * choices.length)
      const output = choices[random].text

      const history = History.buildReply(input, output, context.user.name)
      History.write(history)

      return client.sendText(message.from, output, { quotedMsg: message.id })
    }
  }
}
