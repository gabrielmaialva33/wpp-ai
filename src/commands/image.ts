import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../utils/logger.js'

export const image: ICommand = {
  name: 'image',
  description: 'Gera imagens usando o agente Visual (Picasso)',
  aliases: ['img', 'draw', 'desenhar'],
  usage: '!image <descrição da imagem>',
  category: 'AI',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      // Parse command arguments
      const args = message.body!.slice(1).split(' ')
      args.shift() // Remove command name

      if (args.length === 0) {
        await client.sendText(
          message.from,
          '*Uso:* !image [provider] <descrição>\n\n' +
            '*Provider disponível:*\n' +
            '• nvidia - Stable Diffusion via NVIDIA\n\n' +
            '*Exemplo:* !image nvidia um gato astronauta no espaço',
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
        await client.sendText(message.from, '❌ Por favor, forneça uma descrição da imagem.', {
          quotedMsg: message.id,
        })
        return
      }

      // Send initial message
      await client.sendText(message.from, '🎨 Gerando imagem... Isso pode levar alguns segundos.', {
        quotedMsg: message.id,
      })

      // Get the appropriate provider
      let provider
      try {
        provider = providerName
          ? AIProviderFactory.getProvider(providerName)
          : await AIProviderFactory.getDefaultImageProvider()
      } catch (error) {
        await client.sendText(
          message.from,
          `❌ Nenhum provider de imagem disponível.`,
          { quotedMsg: message.id }
        )
        return
      }

      if (!provider.capabilities.image) {
        await client.sendText(
          message.from,
          `❌ O provider ${provider.name} não suporta geração de imagens.`,
          { quotedMsg: message.id }
        )
        return
      }

      Logger.info(`Using ${provider.name} provider for image generation`)

      // Generate image
      const response = await provider.generateImage!(prompt, {
        width: 1024,
        height: 1024,
        samples: 1,
      })

      // Send image
      if (response.images && response.images.length > 0) {
        const image = response.images[0]

        if (image.base64) {
          // Send base64 image
          await client.sendImageFromBase64(
            message.from,
            `data:image/png;base64,${image.base64}`,
            'generated.png',
            `🎨 *${prompt}*\n_Gerado com ${provider.name.toUpperCase()}_`
          )
        } else if (image.url) {
          // Send image from URL
          await client.sendImage(
            message.from,
            image.url,
            'generated.png',
            `🎨 *${prompt}*\n_Gerado com ${provider.name.toUpperCase()}_`,
            message.id
          )
        }

        Logger.info(`Image generated successfully with ${provider.name}`)
      } else {
        throw new Error('Nenhuma imagem foi gerada')
      }
    } catch (error) {
      Logger.error(`Image command error: ${error}`)
      await client.sendText(message.from, `❌ Erro ao gerar imagem: ${error}`, {
        quotedMsg: message.id,
      })
    }
  },
}
