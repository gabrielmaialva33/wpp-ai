import { Container } from 'inversify'

import { TYPES } from './types'
import { UserRepository } from '@/core/repositories/user.repository'

const container = new Container()

container.bind(TYPES.UserRepository).to(UserRepository).inSingletonScope()

export { container }
