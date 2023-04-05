import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { UserModel } from '@/core/models/user.model'

export const WhatsappUtils = {
  GetUser: async (client: Whatsapp, message: Message) => {
    if (message.isGroupMsg) {
      const author = await client.getContact(message.author)
      return UserModel.sign(author)
    } else {
      const contact = await client.getContact(message.from)
      return UserModel.sign(contact)
    }
  },
}
