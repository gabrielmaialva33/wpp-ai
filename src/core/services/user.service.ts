import { inject, injectable } from 'inversify'

import { TYPES } from '@/core/container'
import { UserCreate, UserUpdate } from '@/core/interfaces/user.interface'
import { UserModel } from '@/core/models/user.model'

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly _userRepository: any
  ) {}

  async create(payload: UserCreate): Promise<UserModel> {
    return this._userRepository.create(payload)
  }

  async createOrUpdate(search: UserUpdate, payload: UserCreate): Promise<UserModel> {
    return this._userRepository.createOrUpdate(search, payload)
  }
}
