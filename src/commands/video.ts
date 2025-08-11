import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../utils/logger.js'

// Comando: !video <opcional:seed> (responder a uma imagem) gera um pequeno vídeo
export const video: ICommand = {
  name: 'video',
  description: 'Gera um vídeo curto a partir de uma imagem (Stable Video Diffusion)',
  aliases: ['vid', 'animar'],
  usage: '!video [seed]\nResponda a uma imagem com o comando para animar.',
  category: 'AI',
  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return

    try {
      await AIProviderFactory.initialize()
      const provider = AIProviderFactory.getProvider('nvidia')
      if (!provider.capabilities.video || !provider.generateVideo) {
        await client.sendText(message.from, '❌ Provider de vídeo indisponível.', {
          quotedMsg: message.id,
        })
        return
      }

      if (!message.quotedMsgId) {
        await client.sendText(
          message.from,
          'Responda a uma imagem com o comando !video para animar. Ex: responda a uma foto e envie *!video 42*',
          { quotedMsg: message.id }
        )
        return
      }

      const quoted = await client.getMessageById(message.quotedMsgId)
      // @ts-ignore - tipo parcial
      if (!quoted || !(quoted.type === 'image' || quoted.mimetype?.startsWith('image/'))) {
        await client.sendText(message.from, 'A mensagem referenciada não contém imagem.', {
          quotedMsg: message.id,
        })
        return
      }

      // Obter base64 da imagem
      // WPPConnect contém campo 'body' com dataUrl base64 em algumas configurações; fallback: downloadMedia
      // @ts-ignore
      let imageBase64: string | undefined = quoted?.body
      if (!imageBase64) {
        try {
          // @ts-ignore
          imageBase64 = await client.downloadMedia(quoted.id)
        } catch (e) {
          Logger.error('Falha ao obter mídia para vídeo: ' + e)
        }
      }
      if (!imageBase64) {
        await client.sendText(message.from, 'Não consegui ler a imagem base64.', {
          quotedMsg: message.id,
        })
        return
      }
      if (!imageBase64.startsWith('data:image')) {
        imageBase64 = 'data:image/png;base64,' + imageBase64
      }

      const args = message.body?.split(' ') || []
      args.shift()
      const seed = args[0] ? Number(args[0]) : 0

      await client.sendText(message.from, '🎬 Gerando vídeo... (pode levar ~10-20s)', {
        quotedMsg: message.id,
      })

      const videoResp = await provider.generateVideo(imageBase64, undefined, { seed })

      // Enviar vídeo (WPPConnect: sendFileFromBase64)
      // @ts-ignore
      if ((client as any).sendFileFromBase64) {
        // @ts-ignore
        await (client as any).sendFileFromBase64(
          message.from,
          'data:video/mp4;base64,' + videoResp.base64,
          'video.mp4',
          `🎬 Vídeo gerado (seed: ${videoResp.seed ?? seed})\nModelo: ${videoResp.model}`,
          message.id
        )
      } else {
        await client.sendText(
          message.from,
          'Vídeo gerado (não foi possível enviar como arquivo).',
          { quotedMsg: message.id }
        )
      }
    } catch (error) {
      Logger.error('Video command error: ' + error)
      await client.sendText(message.from, `❌ Erro ao gerar vídeo: ${error}`, {
        quotedMsg: message.id,
      })
    }
  },
}
