import { inject, injectable } from 'inversify'

import { TYPES } from '@/core/container'
import { GroupInterface } from '@/core/interfaces/group.interface'
import { GroupModel } from '@/core/models/group.model'
import DTO = GroupInterface.DTO

@injectable()
export class GroupService {
  constructor(
    @inject(TYPES.GroupRepository)
    private readonly _groupRepository: GroupInterface.Repository
  ) {}

  async create(payload: DTO.Create): Promise<GroupModel> {
    return this._groupRepository.create(payload)
  }

  async createOrUpdate(search: DTO.Update, payload: DTO.Create): Promise<GroupModel> {
    return this._groupRepository.createOrUpdate(search, payload)
  }
}
