import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { NAMES, PREFIXES } from '../env.js'
import { Context, StringUtils, History } from '../utils/index.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../utils/logger.js'

export const execute = async (client: Whatsapp, message: Message) => {
  if (message.type !== MessageType.CHAT) return
  if (!message.body) return
  if (StringUtils.isCommand(PREFIXES, message.body)) return

  const context = await Context.get(client, message)

  // Process messages that mention the bot
  if (StringUtils.includes(message.body, NAMES)) {
    try {
      const input = `${context.user.username} pergunta: ${context.text}`

      await client.startTyping(message.from, 4000)

      // Initialize factory and get Gemini provider
      await AIProviderFactory.initialize()
      const provider = await AIProviderFactory.getDefaultTextProvider()

      const response = await provider.generateText(input, {
        temperature: 0.8,
        maxTokens: 512,
      })

      const history = History.build(input, response.content, context.user.username)
      History.write(history)

      return client.sendText(message.from, response.content, { quotedMsg: message.id })
    } catch (error) {
      Logger.error(`AI chat middleware error: ${error}`)
    }
  }

  // Check if the message is a reply to the bot
  if (message.quotedMsgId) {
    const quotedMessage = await client.getMessageById(message.quotedMsgId)
    const WID = await client.getWid()

    // @ts-ignore
    if (quotedMessage.sender.id._serialized === WID) {
      try {
        const input = `${context.user.username} pergunta: ${context.text}`

        await client.startTyping(message.from, 2000)

        // Initialize factory and get Gemini provider
        await AIProviderFactory.initialize()
        const provider = await AIProviderFactory.getDefaultTextProvider()

        const response = await provider.generateText(input, {
          temperature: 0.8,
          maxTokens: 512,
        })

        const history = History.buildReply(input, response.content, context.user.username)
        History.write(history)

        return client.sendText(message.from, response.content, { quotedMsg: message.id })
      } catch (error) {
        Logger.error(`AI chat reply error: ${error}`)
      }
    }
  }
}
