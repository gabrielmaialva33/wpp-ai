import { config, createLogger, format, transports } from 'winston'
import { StringUtils } from '@/core/helpers/string.utils'

const Log = createLogger({
  level: 'silly',
  levels: config.npm.levels,
  format: format.combine(format.colorize(), format.padLevels(), format.simple()),
  transports: [new transports.Console()],
})

export const Logger = {
  info: (message: string, context: string) => Log.info(message, context),

  error: (message: string, context: string) => Log.error(message, context),

  warn: (message: string, context: string) => Log.warn(message, context),

  debug: (message: string, context: string) => Log.debug(message, context),
}

export const LogKnex = {
  debug: (message: any) => {
    Logger.debug(StringUtils.FormatQuery(message.sql), 'Knex-Query')
    Logger.debug(StringUtils.FormatBindings(message.bindings), 'Knex-Bindings')
  },
  error: (message: any) => {
    Logger.error(StringUtils.FormatQuery(message.sql), 'Knex-Query')
    Logger.error(StringUtils.FormatBindings(message.bindings), 'Knex-Bindings')
  },
  enableColors: true,
}
