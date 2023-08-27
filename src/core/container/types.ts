import { UserRepository } from '@/core/repositories/user.repository'
import { GroupRepository } from '@/core/repositories/group.repository'

export const TYPES = {
  Model: Symbol.for('Model'),
  UserRepository: Symbol.for(UserRepository.name),
  GroupRepository: Symbol.for(GroupRepository.name),
}
