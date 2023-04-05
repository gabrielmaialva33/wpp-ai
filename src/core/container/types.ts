import { UserRepository } from '@/core/repositories/user.repository'

export const TYPES = {
  Model: Symbol.for('Model'),
  UserRepository: Symbol.for(UserRepository.name),
}
