import { Message } from '@wppconnect-team/wppconnect'

export interface AgentPersonality {
  name: string
  emoji: string
  traits: {
    formality: number // 0-1
    humor: number // 0-1
    verbosity: number // 0-1
    empathy: number // 0-1
  }
  catchPhrases: string[]
  specialties: string[]
}

export interface AgentMemory {
  shortTerm: Map<string, any> // Current conversation
  longTerm: Map<string, any> // Persistent memory
  context: {
    lastMessages: Message[]
    currentTopic: string
    participants: Set<string>
    mood: 'positive' | 'negative' | 'neutral' | 'mixed'
  }
}

export interface AgentCapabilities {
  text: boolean
  image: boolean
  code: boolean
  math: boolean
  research: boolean
  analysis: boolean
  creative: boolean
  translation: boolean
}

export interface AgentReaction {
  emoji: string
  reason: string
  confidence: number
}

export interface AgentResponse {
  content: string
  reactions?: AgentReaction[]
  suggestedAgents?: string[]
  confidence: number
  reasoning?: string
  metadata?: {
    model: string
    tokens: number
    processingTime: number
  }
}

export interface ConversationContext {
  messages: Message[]
  topic: string
  participants: string[]
  mood: string
  language: string
  groupId: string
}

export interface IAgent {
  id: string
  name: string
  role: string
  personality: AgentPersonality
  capabilities: AgentCapabilities
  memory: AgentMemory
  modelConfig: {
    provider: 'nvidia' | 'gemini'
    model: string
    temperature?: number
    maxTokens?: number
  }

  // Core methods
  initialize(): Promise<void>
  canHandle(message: string, context: ConversationContext): Promise<number> // 0-1 confidence
  process(message: string, context: ConversationContext): Promise<AgentResponse>
  react(message: Message, context: ConversationContext): Promise<AgentReaction | null>

  // Memory methods
  remember(key: string, value: any, persistent?: boolean): void
  recall(key: string): any
  forget(key: string): void

  // Collaboration methods
  delegateTo(agentId: string, task: string): Promise<AgentResponse>
  consultWith(agentId: string, question: string): Promise<string>

  // Conversation methods
  shouldInterrupt(context: ConversationContext): boolean
  getTypingDuration(responseLength: number): number
  formatResponse(content: string, context: ConversationContext): string
}
