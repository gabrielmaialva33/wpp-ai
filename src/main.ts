import 'reflect-metadata'

import { Bot } from '@/bot/core/bot'
import { Knex } from '@/lib/objection'
import { Logger } from '@/core/helpers/logger.utils'

const main = async () => {
  try {
    await Knex.migrate.latest().then(() => Logger.info('Database migrated', 'Main'))
    await Bot().then(() => Logger.info('Bot started', 'Bot'))
  } catch (error) {
    Logger.error(error, 'Main')
  }
}

;(async () => {
  await main()
})()
