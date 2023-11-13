import { BaseRepository } from '@/core/repositories/base.repository'
import { UserModel } from '@/core/models/user.model'
import { UserRepositoryInterface } from '@/core/interfaces/user.interface'

export class UserRepository extends BaseRepository<UserModel> implements UserRepositoryInterface {
  constructor() {
    super(UserModel)
  }
}
