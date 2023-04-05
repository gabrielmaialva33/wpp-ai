import { injectable } from 'inversify'

import { BaseRepository } from '@/core/repositories/base.repository'
import { UserModel } from '@/core/models/user.model'
import { UserInterface } from '@/core/interfaces/user.interface'

export class UserRepository extends BaseRepository<UserModel> implements UserInterface.Repository {
  constructor() {
    super(UserModel)
  }
}
