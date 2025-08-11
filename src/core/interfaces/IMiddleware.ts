import { Message, Whatsapp } from '@wppconnect-team/wppconnect'

export interface MiddlewareContext {
  client: Whatsapp
  message: Message
  user?: {
    id: string
    username: string
    isGroup: boolean
  }
  session?: Record<string, any>
  metadata?: Record<string, any>
}

export interface IMiddleware {
  name: string
  priority?: number
  enabled?: boolean
  execute(context: MiddlewareContext, next: () => Promise<void>): Promise<void>
}
