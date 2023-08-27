import { Container } from 'inversify'

import { TYPES } from './types'
import { GroupRepository, UserRepository } from '@/core/repositories'

const container = new Container()

container.bind(TYPES.UserRepository).to(UserRepository).inSingletonScope()
container.bind(TYPES.GroupRepository).to(GroupRepository).inSingletonScope()

export { container }
