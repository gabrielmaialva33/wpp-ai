import { Knex } from 'knex'

import { LogKnex } from '@/core/helpers/logger.utils'
import { Env } from '@/config/env'

export const DatabaseConfig: Knex.Config<Knex.Sqlite3ConnectionConfig> = {
  client: 'better-sqlite3',
  connection: { filename: `${process.cwd()}/database.sqlite` },
  useNullAsDefault: true,
  migrations: {
    tableName: 'knex_migrations',
    directory: `${process.cwd()}/src/database/migrations`,
  },
  seeds: { directory: `${process.cwd()}/src/database/seeds` },
  log: { ...LogKnex },
  debug: Env.DB_DEBUG,
}
