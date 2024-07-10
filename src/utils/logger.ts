import { config, createLogger, format, transports } from 'winston'

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

const customFormat = format.printf(({ level, message, stack }) => {
  return `${level}: ${stack || message}`
})

export const defaultLogger = createLogger({
  level: 'silly',
  levels: config.npm.levels,
  format: format.combine(
    format.errors({ stack: true }),
    format.colorize(),
    format.padLevels(),
    format.simple(),
    customFormat
  ),
  transports: [new transports.Console()],
})

export const logger = {
  error: (message: string, error?: Error) => {
    if (error) {
      defaultLogger.error(message, { stack: error.stack })
    } else {
      defaultLogger.error(message)
    }
  },
  warn: (message: string) => defaultLogger.warn(message),
  info: (message: string) => defaultLogger.info(message),
  http: (message: string) => defaultLogger.http(message),
  verbose: (message: string) => defaultLogger.verbose(message),
  debug: (message: string) => defaultLogger.debug(message),
  silly: (message: string) => defaultLogger.silly(message),
}
