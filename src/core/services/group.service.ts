import { inject, injectable } from 'inversify'

import { TYPES } from '@/core/container'
import { GroupModel } from '@/core/models/group.model'
import {
  GroupCreate,
  GroupUpdate,
} from '@/core/interfaces/group.interface'

@injectable()
export class GroupService {
  constructor(
    @inject(TYPES.GroupRepository)
    private readonly _groupRepository: any,
  ) {}

  async create(payload: GroupCreate): Promise<GroupModel> {
    return this._groupRepository.create(payload)
  }

  async createOrUpdate(search: GroupUpdate, payload: GroupCreate): Promise<GroupModel> {
    return this._groupRepository.createOrUpdate(search, payload)
  }
}
