import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../utils/logger.js'

// Middleware: comenta imagens enviadas no grupo com breve descrição
export const execute = async (client: Whatsapp, message: Message) => {
  try {
    if (message.type !== MessageType.IMAGE) return

    await AIProviderFactory.initialize()
    let provider
    try {
      provider = AIProviderFactory.getProvider('nvidia')
    } catch {
      return
    }

    if (!provider.capabilities.vision || !provider.analyzeImage) return

    // Tentar obter base64
    // @ts-ignore
    let imageBase64: string | undefined = message.body
    if (!imageBase64) {
      try {
        // @ts-ignore
        imageBase64 = await client.downloadMedia(message.id)
      } catch (e) {
        Logger.debug('Falha download imagem: ' + e)
      }
    }
    if (!imageBase64) return
    if (!imageBase64.startsWith('data:image')) imageBase64 = 'data:image/png;base64,' + imageBase64

    const analysis = await provider.analyzeImage({
      imageBase64,
      prompt: 'Descreva brevemente a imagem em PT-BR e destaque 2 detalhes.',
    })

    await client.sendText(message.from, `🖼️ *Descrição da imagem:*\n${analysis.content}`, {
      quotedMsg: message.id,
    })
  } catch (error) {
    Logger.debug('vision-comment middleware error: ' + error)
  }
}
