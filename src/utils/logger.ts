import { config, createLogger, format, transports } from 'winston'
import { FormatWrap, TransformableInfo } from 'logform'

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

export interface MetaInfo {
  session?: string
  type?: string
}

export interface SessionInfo extends TransformableInfo, MetaInfo {}

export const formatLabelSession: FormatWrap = format((info: SessionInfo, _opts?: any) => {
  const parts = []
  if (info.session) {
    parts.push(info.session)
    delete info.session
  }
  if (info.type) {
    parts.push(info.type)
    delete info.type
  }

  if (parts.length) {
    let prefix = parts.join(':')
    info.message = `[${prefix}] ${info.message}`
  }
  return info
})

export const defaultLogger = createLogger({
  level: 'silly',
  levels: config.npm.levels,
  format: format.combine(
    formatLabelSession(),
    format.colorize(),
    format.padLevels(),
    format.simple()
  ),
  transports: [new transports.Console()],
})

export const logger = {
  error: (message: string, meta?: MetaInfo) => defaultLogger.error(message, meta),
  warn: (message: string, meta?: MetaInfo) => defaultLogger.warn(message, meta),
  info: (message: string, meta?: MetaInfo) => defaultLogger.info(message, meta),
  http: (message: string, meta?: MetaInfo) => defaultLogger.http(message, meta),
  verbose: (message: string, meta?: MetaInfo) => defaultLogger.verbose(message, meta),
  debug: (message: string, meta?: MetaInfo) => defaultLogger.debug(message, meta),
  silly: (message: string, meta?: MetaInfo) => defaultLogger.silly(message, meta),
}
