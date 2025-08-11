import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../utils/logger.js'

export const compare: ICommand = {
  name: 'compare',
  description: 'Compara respostas de diferentes IAs',
  aliases: ['cmp', 'versus'],
  usage: '!compare <sua pergunta>',
  category: 'AI',

  async execute(client: Whatsapp, message: Message) {
    try {
      // Parse command arguments
      const args = message.body!.slice(1).split(' ')
      args.shift() // Remove command name

      const prompt = args.join(' ')

      if (!prompt || prompt.trim().length === 0) {
        await client.sendText(
          message.from,
          '❌ Por favor, forneça uma pergunta para comparar as respostas.',
          { quotedMsg: message.id }
        )
        return
      }

      // Start typing indicator
      await client.startTyping(message.from, 5000)

      // Send initial message
      await client.sendText(
        message.from,
        '🔄 Consultando múltiplas IAs... Isso pode levar alguns segundos.',
        { quotedMsg: message.id }
      )

      // Get responses from all providers
      const results = await AIProviderFactory.compareProviders(prompt)

      // Format and send results
      let response = `*🤖 Comparação de IAs*\n`
      response += `*Pergunta:* ${prompt}\n\n`
      response += '─'.repeat(30) + '\n\n'

      for (const [providerName, answer] of results) {
        response += `*${providerName.toUpperCase()}:*\n`
        response += `${answer.substring(0, 500)}` // Limit each response to 500 chars
        if (answer.length > 500) {
          response += '...'
        }
        response += '\n\n' + '─'.repeat(30) + '\n\n'
      }

      await client.sendText(message.from, response, { quotedMsg: message.id })
    } catch (error) {
      Logger.error(`Compare command error: ${error}`)
      await client.sendText(message.from, `❌ Erro ao comparar respostas: ${error}`, {
        quotedMsg: message.id,
      })
    }
  },
}
