import { Knex } from 'knex'

import { UserModel } from '@/core/models/user.model'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(UserModel.tableName, (table) => {
    table.increments(UserModel.idColumn).primary()

    table.string('name', 40).notNullable()
    table.string('username', 20).notNullable().unique()
    table.string('wac_id', 20).unique()
    table.string('wag_id', 20).unique()
    table.string('wa_user', 40)

    table.boolean('is_deleted').defaultTo(false)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(UserModel.tableName)
}
