import { inject, injectable } from 'inversify'

import { TYPES } from '@/core/container'
import { UserInterface } from '@/core/interfaces/user.interface'
import { UserModel } from '@/core/models/user.model'

import DTO = UserInterface.DTO

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly _userRepository: UserInterface.Repository
  ) {}

  async create(payload: DTO.Create): Promise<UserModel> {
    return this._userRepository.create(payload)
  }

  async createOrUpdate(search: DTO.Create, payload: DTO.Create): Promise<UserModel> {
    return this._userRepository.createOrUpdate(search, payload)
  }
}
