import 'dotenv/config'

import { cleanEnv, str } from 'envalid'

export const Env = cleanEnv(process.env, {
  WPP_SESSION: str({ desc: 'Session Name', example: 'wpp_ai' }),
  BOT_NAME: str({ desc: 'Bot Name', example: 'AI' }),
  BOT_NAMES: str({ desc: 'Bot Names', example: '["AI", "Bot"]' }),
  PREFIXES: str({ desc: 'Command Prefixes', example: '["!", "/", "$"]' }),
  GEMINI_API_KEY: str({
    desc: 'Google Gemini API Key',
    example: 'AIzaSy...',
    docs: 'https://ai.google.dev/gemini-api/docs',
  }),
  NVIDIA_API_KEY: str({
    desc: 'NVIDIA NIM API Key',
    example: 'nvapi-...',
    docs: 'https://build.nvidia.com/',
  }),
  DEFAULT_TEXT_PROVIDER: str({
    desc: 'Default AI provider for text generation',
    default: 'gemini',
    choices: ['gemini', 'nvidia'],
  }),
  DEFAULT_IMAGE_PROVIDER: str({
    desc: 'Default AI provider for image generation',
    default: 'nvidia',
    choices: ['nvidia', 'gemini'],
  }),
})

export const PREFIXES = JSON.parse(Env.PREFIXES) as string[]
export const NAMES = JSON.parse(Env.BOT_NAMES) as string[]
