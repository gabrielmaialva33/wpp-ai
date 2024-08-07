import * as fs from 'node:fs'
import * as crypto from 'node:crypto'

import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { Repl } from '../plugins/replicate.plugin.js'
import { StringUtils, Telegraph } from '../utils/index.js'

export const animate = {
  name: 'animate',
  description: 'gera uma animação com o texto e imagem informados',
  execute: async (client: Whatsapp, message: Message) => {
    if (!message.body) return

    const input = StringUtils.getParam(message.body, 1)
    if (!input) return

    if (message.quotedMsgId) {
      const quotedMessage = await client.getMessageById(message.quotedMsgId)

      console.log(`input: ${input}`)

      const imageUrl = quotedMessage.deprecatedMms3Url

      const imageBase64 = await client.downloadMedia(quotedMessage.id)
      const randomId = crypto.randomBytes(6).toString('hex')
      const filename = `./cache/${randomId}.png`
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

      fs.writeFileSync(filename, base64Data, 'base64')

      const file = await Telegraph.uploadByBuffer(fs.readFileSync(filename), 'image/png')

      if (imageUrl) {
        const response = await Repl.animation(file.link, input)
        if (response)
          return client.sendVideoAsGif(
            message.from,
            response as any,
            'animation.mp4',
            `a animação foi gerada`
          )
      }
    } else {
      await client.sendText(
        message.from,
        `manã.. ocê precisa responder a uma imagem para que eu possa transformá-la em uma animação!`,
        { quotedMsg: message.id }
      )
    }
  },
}
