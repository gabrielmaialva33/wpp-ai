import { Bot } from './bot.js'
import { Logger } from './utils/logger.js'
import { History } from './utils/index.js'

const main = async () => {
  try {
    History.clean()
    await Bot().then(() => Logger.info('bot started'))
  } catch (error) {
    console.log(error)
  }
}

;(async () => {
  await main()
})()
