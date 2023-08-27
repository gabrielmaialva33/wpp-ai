import { BaseRepository } from '@/core/repositories/base.repository'
import { GroupModel } from '@/core/models/group.model'
import { GroupInterface } from '@/core/interfaces/group.interface'

export class GroupRepository
  extends BaseRepository<GroupModel>
  implements GroupInterface.Repository
{
  constructor() {
    super(GroupModel)
  }
}
