import { Bot } from './bot.js'
import { Logger } from './utils/logger.js'

const main = async () => {
  try {
    await Bot().then(() => Logger.info('bot started'))
  } catch (error) {
    console.log(error)
  }
}

;(async () => {
  await main()
})()
