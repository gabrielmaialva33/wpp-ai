import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { StringUtils } from '../utils/index.js'
import { AI } from '../plugins/openai.plugin.js'

export const image = {
  name: 'image',
  description: 'gera uma imagem com o texto informado',
  execute: async (client: Whatsapp, message: Message) => {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    const input = StringUtils.getParam(message.body, 1)
    if (!input) return

    const response = await AI.createImage(input)
    if (!response.data || response.data.length === 0)
      return client.sendText(message.from, '_não foi possível gerar a imagem_', {
        quotedMsg: message.id,
      })

    const data = response.data[0]
    if (!data.url) return

    return client.sendImage(message.from, data.url, 'image.png', data.revised_prompt, message.id)
  },
}
