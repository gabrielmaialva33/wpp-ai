import * as fs from 'node:fs'
import * as crypto from 'node:crypto'

import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { AI } from '../plugins/openai.plugin.js'

export const variation = {
  name: 'variation',
  description: 'cria uma variação de uma imagem',
  execute: async (client: Whatsapp, message: Message) => {
    if (message.quotedMsgId) {
      const quotedMessage = await client.getMessageById(message.quotedMsgId)

      const imageUrl = quotedMessage.deprecatedMms3Url
      if (imageUrl) {
        const imageBase64 = await client.downloadMedia(quotedMessage.id) // base64
        const randomId = crypto.randomBytes(6).toString('hex')

        const filename = `./cache/${randomId}.png`
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

        fs.writeFileSync(filename, base64Data, 'base64')

        const response = await AI.createImageVariation(filename)
        if (!response.data || response.data.length === 0) return

        const data = response.data[0]
        if (!data.url) return

        return client.sendImage(message.from, data.url, `${randomId}.png`, undefined, message.id)
      }
    } else {
      await client.sendText(
        message.from,
        `manã.. ocê precisa responder a uma imagem para que eu possa criar uma variação dela!`,
        { quotedMsg: message.id }
      )
    }
  },
}
