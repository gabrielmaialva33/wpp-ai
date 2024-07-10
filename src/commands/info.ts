import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { systemInfo } from '../utils/system.js'

export const info = {
  name: 'info',
  description: 'Veja informações do sistema',
  execute: async (client: Whatsapp, message: Message) => {
    const system = systemInfo()
    await client.sendText(message.from, system, { quoted: message })
  },
}
