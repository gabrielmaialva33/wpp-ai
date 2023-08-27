import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { UserModel } from '@/core/models/user.model'
import console from 'console'
import { GroupModel } from '@/core/models/group.model'

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

  GetGroup: async (client: Whatsapp, message: Message) => {
    if (message.isGroupMsg) {
      const group = await client.getContact(message.chatId)
      return GroupModel.sign(group)
    } else {
      return null
    }
  },

  GetChat: async (client: Whatsapp, message: Message) => {
    if (message.isGroupMsg) {
      const chat = await client.getChatById(message.chatId)
      return chat
    } else {
      return null
    }
  },
}
