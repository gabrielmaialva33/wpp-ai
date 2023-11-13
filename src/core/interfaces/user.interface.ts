import { RepositoryInterface } from '../interfaces/repository.interface'
import { UserModel } from '@/core/models/user.model'

export interface UserRepositoryInterface extends RepositoryInterface<UserModel> {}

export interface UserCreate extends Omit<UserEntity, 'id'> {}

export interface UserUpdate extends Partial<UserCreate> {}

export interface UserEntity {
  id?: number
  name: string
  username: string
  wac_id?: string
  wag_id?: string
  wa_user?: string
}
