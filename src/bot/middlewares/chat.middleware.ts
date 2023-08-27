import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { WhatsappUtils } from '@/helpers/whatsapp.utils'
import { container } from '@/core/container'
import { UserService } from '@/core/services/user.service'
import { GroupService } from '@/core/services/group.service'

export const ChatMiddleware = async (client: Whatsapp, message: Message) => {
  // save user
  const user = await WhatsappUtils.GetUser(client, message)
  await container.resolve(UserService).createOrUpdate({ wa_user: user.wa_user }, user)

  // save group
  const group = await WhatsappUtils.GetGroup(client, message)
  if (group) await container.resolve(GroupService).createOrUpdate({ wpp_id: group.wpp_id }, group)
}
