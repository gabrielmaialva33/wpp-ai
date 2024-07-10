import 'dotenv/config'

import { cleanEnv, str } from 'envalid'

export const Env = cleanEnv(process.env, {
  SESSION_NAME: str({ desc: 'Session Name', example: 'wpp_ai' }),
  BOT_NAME: str({ desc: 'Bot Name', example: 'AI' }),
  OPENAI_TOKEN: str({
    desc: 'OpenAI API Token',
    example: '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',
    docs: 'https://beta.openai.com/docs/api-reference/authentication',
  }),
})
