import { Knex } from 'knex'

import { GroupModel } from '@/core/models/group.model'

// {
//   groupData: {
//     id: {
//       server: 'g.us',
//       user: '120363169559405965',
//       _serialized: '120363169559405965@g.us'
//     },
//     name: 'WppAI',
//     type: 'in',
//     isBusiness: false,
//     isEnterprise: false,
//     isSmb: false,
//     formattedName: 'WppAI',
//     isMe: false,
//     isMyContact: false,
//     isPSA: false,
//     isUser: false,
//     isWAContact: false,
//     profilePicThumbObj: {
//       eurl: 'https://pps.whatsapp.net/v/t61.24694-24/368492382_848034213626275_1951846372118280846_n.jpg?ccb=11-4&oh=01_AdT5Kl3J_gVuYgO3erWD0x-qq5tDkhkX4VKrhuME3FjM-Q&oe=64F80E02&_nc_cat=111',
//       id: [Object],
//       img: 'https://pps.whatsapp.net/v/t61.24694-24/368492382_848034213626275_1951846372118280846_n.jpg?stp=dst-jpg_s96x96&ccb=11-4&oh=01_AdQee8oc1f9G3EX_xkBbpc6P30xZdHCyNonCe4qC97zZhw&oe=64F80E02&_nc_cat=111',
//       imgFull: 'https://pps.whatsapp.net/v/t61.24694-24/368492382_848034213626275_1951846372118280846_n.jpg?ccb=11-4&oh=01_AdT5Kl3J_gVuYgO3erWD0x-qq5tDkhkX4VKrhuME3FjM-Q&oe=64F80E02&_nc_cat=111',
//       tag: '1693115148'
//     },
//     msgs: null
//   }
// }
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(GroupModel.tableName, (table) => {
    table.increments(GroupModel.idColumn).primary()

    table.string('name').notNullable()
    table.string('wpp_id').notNullable().unique()

    table.boolean('is_deleted').defaultTo(false)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at').defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {}
