import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'

import { StringUtils } from '../utils/index.js'

export const image = {
  name: 'image',
  description: 'gera uma imagem com o texto informado',
  execute: async (_client: Whatsapp, message: Message) => {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    const text = StringUtils.removePrefix(message.body)
    console.log('image', text)
  },
}
