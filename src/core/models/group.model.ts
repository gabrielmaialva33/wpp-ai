import { BaseModel } from '@/core/models/base.model'
import { Contact } from '@wppconnect-team/wppconnect'
import { GroupEntity } from '@/core/interfaces/group.interface'

export class GroupModel extends BaseModel {
  static tableName = 'groups'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  name: string
  wpp_id: string

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
  static sign(group: Contact): GroupEntity {
    const name = group.name ?? group.shortName ?? group.name ?? group.formattedName
    return {
      name: name,
      wpp_id: group.id.user,
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
