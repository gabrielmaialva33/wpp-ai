import { create, SocketState, Whatsapp } from '@wppconnect-team/wppconnect'
import { systemInfo } from './system.js'
import { logger } from './utils/logger.js'

export const SESSION_NAME = 'wpp_ai'

export const Bot = async () =>
  create({
    session: SESSION_NAME,
    disableWelcome: true,
  }).then((client) => start(client))

const start = async (client: Whatsapp) => {
  client.onStateChange((state: SocketState) => {
    if (state === SocketState.CONFLICT) client.useHere()

    if (state === SocketState.UNPAIRED) {
      logger.info(`bot with session name ${SESSION_NAME} is unpaired`)
    }
    if (state === SocketState.CONNECTED)
      logger.info(`bot with session name ${SESSION_NAME} is connected`)
  })

  client.onReactionMessage((react: any) => {
    logger.info(`reaction message: ${react}`)
  })

  client.onMessage(async (message) => {
    if (message.body === 'Hi') {
      await client.sendText(message.from, systemInfo())
    }
  })
}
