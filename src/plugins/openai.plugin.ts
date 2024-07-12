import * as fs from 'node:fs'

import { OpenAI as OpenAIApi } from 'openai'
import { CompletionCreateParamsBase } from 'openai/resources/completions'
import { DateTime } from 'luxon'
import jimp from 'jimp'

import { Env } from '../env.js'
import { StringUtils } from '../utils/index.js'

class OpenAI extends OpenAIApi {
  private completion = {
    model: 'gpt-3.5-turbo-instruct',
    temperature: 0.9,
    max_tokens: 128,
    frequency_penalty: 0.8,
    presence_penalty: 0.8,
    n: 1,
    stop: ['||'],
  } as CompletionCreateParamsBase

  constructor() {
    super({ apiKey: Env.OPENAI_TOKEN })
  }

  async complete(text: string, username: string) {
    if (!fs.existsSync(process.cwd() + '/tmp')) fs.mkdirSync(process.cwd() + '/tmp')

    const tempMain = fs.readFileSync(process.cwd() + '/tmp/main.gpt.txt', 'utf8')
    const history = fs.readFileSync(process.cwd() + '/tmp/history.gpt.txt', 'utf8')

    const main = tempMain
      .replace(
        '$date',
        DateTime.local({ zone: 'America/Sao_Paulo' }).toLocaleString(DateTime.DATE_FULL)
      )
      .replace(
        '$time',
        DateTime.local({ zone: 'America/Sao_Paulo' }).toLocaleString(DateTime.TIME_SIMPLE)
      )

    // this.logger.info(
    //   `context: ${JSON.stringify(StringUtils.InfoText(main + history + text))}`,
    //   'ai.complete'
    // )

    const prompt = StringUtils.removeBreakLines(
      main + history + text + `${Env.BOT_NAME}(${username}):||`
    )

    if (StringUtils.countTokens(prompt) > 4096) {
      // this.logger.error('tokens limit exceeded!', 'ai.complete')

      //await HistoryUtils.populate_history()
      return this.completions.create({ ...this.completion, prompt }, { timeout: 30000 })
    }

    return this.completions.create({ ...this.completion, prompt }, { timeout: 30000 })
  }

  async createImage(text: string) {
    return this.images.generate(
      {
        prompt: text,
        model: 'dall-e-3',
        n: 1,
        quality: 'standard',
        size: '1024x1024',
      },
      { timeout: 60000 }
    )
  }

  async createImageVariation(path: string) {
    const file = fs.readFileSync(path)
    await jimp.read(file).then((image) => image.writeAsync(path))
    const image = await jimp.read(path)
    await image.resize(1024, 1024).writeAsync(path)

    return this.images.createVariation({
      model: 'dall-e-2',
      size: '1024x1024',
      image: fs.createReadStream(path),
    })
  }
}

export const AI = new OpenAI()
