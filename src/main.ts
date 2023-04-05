import 'reflect-metadata'

import { Bot } from '@/bot/core/bot'
import { Orm } from '@/lib/objection'
import { Logger } from '@/core/helpers/logger.utils'

const main = async () => {
  try {
    await Orm.migrate.latest()
    Bot().then(() => Logger.info('Bot started', 'Bot'))
  } catch (error) {
    Logger.error(error, 'Main')
  }
}

;(async () => {
  await main()
})()
