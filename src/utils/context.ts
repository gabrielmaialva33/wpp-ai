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
  replyToUser: UserContext | null
  text: string | null
  replyToText: string | null
}

const getUser = async (client: Whatsapp, message: Message): Promise<UserContext> => {
  const user = await client.getContact(message.author ? message.author : message.from)

  console.log(`GET USER
    user.pushname: ${user.pushname},
    user.formattedName: ${user.formattedName},
    user.shortName: ${user.shortName},
    user.name: ${user.name}
    user.verifiedName: ${user.verifiedName}
  `)

  const username = user.pushname
    ? user.pushname
    : user.formattedName.split(' ')[1]
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
  console.log(`REPLY TO
    user.pushname: ${user.pushname},
    user.formattedName: ${user.formattedName},
    user.shortName: ${user.shortName},
    user.name: ${user.name}
    user.verifiedName: ${user.verifiedName}
  `)

  const username = user.pushname
    ? user.pushname
    : user.formattedName.split(' ')[1]
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

const get = async (client: Whatsapp, message: Message): Promise<Context> => {
  const user = await getUser(client, message)
  const replyTo = await getReplyTo(client, message)

  return {
    user,
    replyToUser: replyTo,
    text: user.message,
    replyToText: replyTo ? replyTo.message : null,
  }
}

export const Context = {
  getUser,
  getReplyTo,
  get,
}
