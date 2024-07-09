import { Bot } from './bot.js'
import { logger } from './utils/logger.js'

const main = async () => {
  try {
    await Bot().then(() => logger.info('bot started'))
  } catch (error) {
    console.error(error)
  }
}

;(async () => {
  await main()
})()
