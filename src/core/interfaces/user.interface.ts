import { RepositoryInterface } from '@/core/interfaces/repository.interface'
import { UserModel } from '@/core/models/user.model'

export namespace UserInterface {
  export interface Repository extends RepositoryInterface<UserModel> {}

  export interface Entity {
    id?: number
    name: string
    username: string
    wac_id?: string
    wag_id?: string
    wa_user?: string
  }

  export namespace DTO {
    export interface Create {
      name: string
      username: string
      wac_id?: string
      wag_id?: string
      wa_user?: string
    }

    export interface Update extends Partial<Create> {}
  }
}
