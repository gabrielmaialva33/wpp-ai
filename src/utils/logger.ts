import { config, createLogger, format, transports } from 'winston'

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

export const defaultLogger = createLogger({
  level: 'silly',
  levels: config.npm.levels,
  format: format.combine(
    format.errors({ stack: true }),
    format.colorize(),
    format.padLevels(),
    format.simple()
  ),
  transports: [new transports.Console({})],
})

export const logger = {
  error: (message: string) => defaultLogger.error(message),
  warn: (message: string) => defaultLogger.warn(message),
  info: (message: string) => defaultLogger.info(message),
  http: (message: string) => defaultLogger.http(message),
  verbose: (message: string) => defaultLogger.verbose(message),
  debug: (message: string) => defaultLogger.debug(message),
  silly: (message: string) => defaultLogger.silly(message),
}
