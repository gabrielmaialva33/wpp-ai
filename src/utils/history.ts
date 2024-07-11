import * as fs from 'node:fs'

import { Env } from '../env.js'
import { Context } from './context.js'
import { StringUtils } from './string.utils.js'
import { Logger } from './logger.js'

const NAME = Env.BOT_NAME

export const History = {
  build: (input: string, output: string, replyUser: string) => {
    const io = input.replace(`\n${NAME}(${replyUser}):||`, '')
    return `${io}${NAME}(${replyUser}):||${output}||\n`
  },

  buildReply: (input: string, output: string, replyUser: string) => {
    const io = input.replace(`\n${NAME}(${replyUser}):||`, '')
    return `${io}${NAME}(${replyUser}):||${output}||\n`
  },

  buildChat: ({ user, replyToUser }: Context) => {
    if (replyToUser?.username)
      return `${user.username}(${replyToUser.username}):||${user.message}||\n`
    return `${user.username}:||${user.message}||\n`
  },

  write: (text: string) => {
    if (fs.existsSync(process.cwd() + '/tmp/history.gpt.txt')) {
      const main = fs.readFileSync(process.cwd() + '/tmp/main.gpt.txt', 'utf8')
      const history = fs.readFileSync(process.cwd() + '/tmp/history.gpt.txt', 'utf8')
      const prompt = StringUtils.removeBreakLines(main + history)
      if (StringUtils.countTokens(prompt) > 3700) history.slice(2)
    }
    fs.createWriteStream(process.cwd() + '/tmp/history.gpt.txt', { flags: 'a' }).write(text)
  },

  slice: (n: number) => {
    const historyFile = process.cwd() + '/tmp/history.gpt.txt'
    if (!fs.existsSync(historyFile)) return
    const lines = fs.readFileSync(historyFile, 'utf8').split('\n')
    fs.writeFileSync(historyFile, lines.slice(n).join('\n'))
  },

  clean: () => {
    const isExists = fs.existsSync(process.cwd() + '/tmp/history.gpt.txt')
    if (isExists) fs.unlinkSync(process.cwd() + '/tmp/history.gpt.txt')
    fs.createWriteStream(process.cwd() + '/tmp/history.gpt.txt', { flags: 'a' }).write('')

    Logger.debug('clean history')
  },
}
