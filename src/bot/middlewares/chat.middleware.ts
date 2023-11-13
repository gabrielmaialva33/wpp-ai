import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export const ChatMiddleware = async (_client: Whatsapp, _message: Message) => {
  // save user
  // const user = await WhatsappUtils.GetUser(client, message)
  // await container.resolve(UserService).createOrUpdate({ wa_user: user.wa_user }, user)
  // save group
  // const group = await WhatsappUtils.GetGroup(client, message)\
  // if (group) await container.resolve(GroupService).createOrUpdate({ wpp_id: group.wpp_id }, group)
}
