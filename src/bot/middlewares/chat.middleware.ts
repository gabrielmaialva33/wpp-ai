import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

import { container, TYPES } from '@/core/container'
import { UserService } from '@/core/services/user.service'
import { UserModel } from '@/core/models/user.model'

export const ChatMiddleware = async (client: Whatsapp, message: Message) => {
  const chat = await client.getChatById(message.from)
  const participants = await client.getGroupMembers(chat.id._serialized)
  for (const participant of participants) {
    const contact = await client.getContact(participant.id._serialized)
    const userService = await container.get<UserService>(TYPES.UserRepository)
    const user = await userService.createOrUpdate(UserModel.sign(contact), UserModel.sign(contact))
    console.log(user)
  }
}
