import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import console from 'console'
import { UserService } from '@/core/services/user.service'
import { UserModel } from '@/core/models/user.model'
import { container, TYPES } from '@/core/container'
import { UserRepository } from '@/core/repositories/user.repository'

export const ChatMiddleware = async (client: Whatsapp, message: Message) => {
  const chat = await client.getChatById(message.from)
  const participants = await client.getGroupMembers(chat.id._serialized)
  for (const participant of participants) {
    const contact = await client.getContact(participant.id._serialized)
    const userService = await container.get<UserService>(TYPES.UserRepository)
    const user = await userService.create(UserModel.sign(contact))
    console.log(user)
  }
}
