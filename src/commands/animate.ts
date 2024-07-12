import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { Repl } from '../plugins/replicate.plugin.js'
import { StringUtils } from '../utils/index.js'
import * as fs from 'node:fs'
import * as crypto from 'node:crypto'

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

      if (imageUrl) {
        const response = await Repl.animation(filename, input)
        console.log(response)

        // return client.sendImage(message.from, data.url, `${randomId}.png`, undefined, message.id)
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
