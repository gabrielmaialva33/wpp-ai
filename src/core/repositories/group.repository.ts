import { BaseRepository } from '@/core/repositories/base.repository'
import { GroupModel } from '@/core/models/group.model'
import { GroupRepositoryInterface } from '@/core/interfaces/group.interface'

export class GroupRepository
  extends BaseRepository<GroupModel>
  implements GroupRepositoryInterface
{
  constructor() {
    super(GroupModel)
  }
}
