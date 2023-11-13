import { Contact } from '@wppconnect-team/wppconnect'

import { BaseModel } from '@/core/models/base.model'
import { UserEntity } from '@/core/interfaces/user.interface'
import { StringUtils } from '@/helpers/string.utils'

export class UserModel extends BaseModel {
  static tableName = 'users'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  name: string
  username: string
  wac_id: string
  wag_id: string
  wa_user: string
  profile_pic: Buffer

  /**
   * ------------------------------------------------------
   * Hooks
   * ------------------------------------------------------
   */

  /**
   * ------------------------------------------------------
   * Methods
   * ------------------------------------------------------
   */
  static sign(contact: Contact): UserEntity {
    const name = contact.pushname ?? contact.shortName ?? contact.name ?? contact.formattedName
    return {
      name,
      username: StringUtils.Slugify(name),
      wac_id: contact.id.user + '@c.us',
      wag_id: contact.id.user + '@g.us',
      wa_user: contact.id.user,
    }
  }

  /**
   * ------------------------------------------------------
   * Serializer
   * ------------------------------------------------------
   */
  $formatJson(json: any) {
    json = super.$formatJson(json)
    return json
  }
}
