import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export interface ICommand {
  name: string
  description: string
  aliases?: string[]
  usage?: string
  category?: string
  cooldown?: number
  permissions?: string[]
  execute(client: Whatsapp, message: Message, args?: string[]): Promise<void>
}
