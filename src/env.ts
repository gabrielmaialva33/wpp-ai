import 'dotenv/config'

import { cleanEnv, str } from 'envalid'

export const Env = cleanEnv(process.env, {
  WPP_SESSION: str({ desc: 'Session Name', example: 'wpp_ai' }),
  BOT_NAME: str({ desc: 'Bot Name', example: 'AI' }),
  PREFIXES: str({ desc: 'Command Prefixes', example: '["!", "/", "$"]' }),
  OPENAI_TOKEN: str({
    desc: 'OpenAI API Token',
    example: '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',
    docs: 'https://beta.openai.com/docs/api-reference/authentication',
  }),
  REPLICATE_API_TOKEN: str({
    desc: 'Replicate API Token',
    example: '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',
    docs: 'https://www.replicate.ai/docs/api/',
  }),
})

export const PREFIXES = JSON.parse(Env.PREFIXES) as string[]
