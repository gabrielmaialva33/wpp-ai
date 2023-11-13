import { GroupModel } from '@/core/models/group.model'
import { RepositoryInterface } from '@/core/interfaces/repository.interface'

export interface GroupRepositoryInterface extends RepositoryInterface<GroupModel> {}

export interface GroupCreate extends Omit<GroupEntity, 'id'> {}

export interface GroupUpdate extends Partial<GroupCreate> {}

export interface GroupEntity {
  id?: number
  name: string
  wpp_id: string
}
