import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import console from 'console'
import { WhatsappUtils } from '@/helpers/whatsapp.utils'

export const ChatMiddleware = async (client: Whatsapp, message: Message) => {
  const user = await WhatsappUtils.GetUser(client, message)
  console.log(user)
}
