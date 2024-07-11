import { Bot } from './bot.js'
import { Logger } from './utils/logger.js'
import { History } from './utils/index.js'

const main = async () => {
  History.clean()
  await Bot().then(() => Logger.info('bot started'))
}

;(async () => {
  try {
    await main()
  } catch (error) {
    console.log(error)
  }
})()
