import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export type UserContext = {
  id: string
  name: string
  username: string
  phone: string
  avatar_url: string | null
  message: string | null
}

export type Context = {
  user: UserContext
  reply_to: UserContext | null
  text: string | null
  reply_to_text: string | null
}

const getUser = async (client: Whatsapp, message: Message): Promise<UserContext> => {
  const user = await client.getContact(message.author ? message.author : message.from)
  const username = user.formattedName.split(' ')[1]
    ? user.formattedName.split(' ')[1]
    : user.formattedName.split(' ')[0]

  const pic = await client.getProfilePicFromServer(user.id._serialized)

  return {
    id: user.id._serialized,
    name: user.formattedName,
    username: username.trim(),
    phone: user.id.user,
    avatar_url: pic ? pic.imgFull : null,
    message: message.body ? message.body : null,
  }
}

const getReplyTo = async (client: Whatsapp, message: Message): Promise<UserContext | null> => {
  if (!message.quotedMsgId) return null

  const quotedMessage = await client.getMessageById(message.quotedMsgId)

  const user = await client.getContact(quotedMessage.sender.id._serialized)
  const username = user.formattedName.split(' ')[1]
    ? user.formattedName.split(' ')[1]
    : user.formattedName.split(' ')[0]

  const pic = await client.getProfilePicFromServer(user.id._serialized)

  return {
    id: user.id._serialized,
    name: user.formattedName,
    username: username.trim(),
    phone: user.id.user,
    avatar_url: pic ? pic.imgFull : null,
    message: quotedMessage.body ? quotedMessage.body : null,
  }
}

const getContext = async (client: Whatsapp, message: Message): Promise<Context> => {
  const user = await getUser(client, message)
  const replyTo = await getReplyTo(client, message)

  return {
    user,
    reply_to: replyTo,
    text: user.message,
    reply_to_text: replyTo ? replyTo.message : null,
  }
}

export const Context = {
  getUser,
  getReplyTo,
  getContext,
}
