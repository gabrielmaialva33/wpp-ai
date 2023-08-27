import { GroupModel } from '@/core/models/group.model'
import { RepositoryInterface } from '@/core/interfaces/repository.interface'

export namespace GroupInterface {
  export interface Repository extends RepositoryInterface<GroupModel> {}

  export interface Entity {
    id?: number
    name: string
    wpp_id: string
  }

  export namespace DTO {
    export interface Create extends Omit<Entity, 'id'> {}

    export interface Update extends Partial<Create> {}
  }
}
