import { createLogger, format, transports, config } from 'winston'

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
