import { BaseModel } from '@/core/models/base.model'

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
}
