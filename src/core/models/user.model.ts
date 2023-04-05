import { BaseModel } from '@/core/models/base.model'
import { Contact } from '@wppconnect-team/wppconnect'
import { UserInterface } from '@/core/interfaces/user.interface'

export class UserModel extends BaseModel {
  static tableName = 'users'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  name!: string
  username!: string
  wac_id?: string
  wag_id?: string
  wa_user?: string

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
  static sign(contact: Contact): UserInterface.Entity {
    return {
      name: contact.name ?? contact.shortName ?? contact.pushname ?? contact.formattedName,
      username: contact.id.user,
      wac_id: contact.id._serialized,
      wag_id: contact.id._serialized,
      wa_user: contact.id._serialized.split('@')[0],
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
