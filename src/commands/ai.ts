import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { RateLimiter } from '../infrastructure/ai/utils/RateLimiter.js'
import { Logger } from '../utils/logger.js'

export const ai: ICommand = {
  name: 'ai',
  description: 'Chat com IA usando diferentes providers',
  aliases: ['chat', 'ask'],
  usage: '!ai [provider] <sua pergunta>',
  category: 'AI',

  async execute(client: Whatsapp, message: Message) {
    try {
      // Parse command arguments
      const args = message.body!.slice(1).split(' ')
      args.shift() // Remove command name

      if (args.length === 0) {
        await client.sendText(
          message.from,
          '*Uso:* !ai [provider] <pergunta>\n\n' +
            '*Providers disponíveis:*\n' +
            '• gemini (padrão) - Google Gemini\n' +
            '• nvidia - NVIDIA NIM\n\n' +
            '*Exemplo:* !ai gemini Qual é a capital do Brasil?',
          { quotedMsg: message.id }
        )
        return
      }

      // Check if first argument is a provider name
      await AIProviderFactory.initialize()
      const availableProviders = AIProviderFactory.getAvailableProviders()

      let providerName: string | undefined
      let prompt: string

      if (availableProviders.includes(args[0].toLowerCase())) {
        providerName = args[0].toLowerCase()
        prompt = args.slice(1).join(' ')
      } else {
        // Use default provider
        prompt = args.join(' ')
      }

      if (!prompt || prompt.trim().length === 0) {
        await client.sendText(message.from, '❌ Por favor, forneça uma pergunta após o comando.', {
          quotedMsg: message.id,
        })
        return
      }

      // Check rate limit
      const rateLimiter = RateLimiter.getInstance()
      const userId = message.from
      const checkProvider = providerName || 'gemini'

      const canProceed = await rateLimiter.checkLimit(userId, checkProvider)
      if (!canProceed) {
        const remaining = rateLimiter.getRemainingRequests(userId, checkProvider)
        await client.sendText(
          message.from,
          `⏳ Limite de requisições atingido!\n\n` +
            `Aguarde um momento antes de fazer outra pergunta.\n` +
            `Requisições restantes:\n` +
            `• Por minuto: ${remaining.minute}\n` +
            `• Por hora: ${remaining.hour}`,
          { quotedMsg: message.id }
        )
        return
      }

      // Start typing indicator
      await client.startTyping(message.from, 3000)

      // Get the appropriate provider
      const provider = providerName
        ? AIProviderFactory.getProvider(providerName)
        : await AIProviderFactory.getDefaultTextProvider()

      Logger.info(`Using ${provider.name} provider for AI chat`)

      // Generate response
      const response = await provider.generateText(prompt, {
        temperature: 0.8,
        maxTokens: 1024,
      })

      // Send response with provider info
      const footer = `\n\n_🤖 ${provider.name.toUpperCase()}`
      if (response.usage) {
        const totalTokens = response.usage.totalTokens
        const cost = response.cost?.total
        const costInfo = cost ? ` | 💰 $${cost.toFixed(4)}` : ''
        await client.sendText(
          message.from,
          response.content + footer + ` | 📊 ${totalTokens} tokens${costInfo}_`,
          { quotedMsg: message.id }
        )
      } else {
        await client.sendText(message.from, response.content + footer + '_', {
          quotedMsg: message.id,
        })
      }
    } catch (error) {
      Logger.error(`AI command error: ${error}`)
      await client.sendText(message.from, `❌ Erro ao processar sua solicitação: ${error}`, {
        quotedMsg: message.id,
      })
    }
  },
}
