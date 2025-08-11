import { Message } from '@wppconnect-team/wppconnect'
import {
  IAgent,
  AgentPersonality,
  AgentMemory,
  AgentCapabilities,
  AgentReaction,
  AgentResponse,
  ConversationContext,
} from './IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'

export abstract class BaseAgent implements IAgent {
  public id: string
  public name: string
  public role: string
  public personality: AgentPersonality
  public capabilities: AgentCapabilities
  public memory: AgentMemory
  public modelConfig: {
    provider: 'nvidia' | 'gemini'
    model: string
    temperature?: number
    maxTokens?: number
  }

  constructor(config: {
    id: string
    name: string
    role: string
    personality: AgentPersonality
    capabilities: AgentCapabilities
    modelConfig: {
      provider: 'nvidia' | 'gemini'
      model: string
      temperature?: number
      maxTokens?: number
    }
  }) {
    this.id = config.id
    this.name = config.name
    this.role = config.role
    this.personality = config.personality
    this.capabilities = config.capabilities
    this.modelConfig = config.modelConfig
    
    // Initialize memory
    this.memory = {
      shortTerm: new Map(),
      longTerm: new Map(),
      context: {
        lastMessages: [],
        currentTopic: '',
        participants: new Set(),
        mood: 'neutral',
      },
    }
  }

  async initialize(): Promise<void> {
    await AIProviderFactory.initialize()
    Logger.info(`Agent ${this.name} initialized with model ${this.modelConfig.model}`)
  }

  abstract canHandle(message: string, context: ConversationContext): Promise<number>

  abstract process(message: string, context: ConversationContext): Promise<AgentResponse>

  async react(message: Message, _context: ConversationContext): Promise<AgentReaction | null> {
    // Analyze message for appropriate reaction
    const sentiment = await this.analyzeSentiment(message.body || '')
    const confidence = await this.canHandle(message.body || '', _context)

    // Select appropriate reaction based on analysis
    if (confidence > 0.8) {
      return {
        emoji: this.getReactionEmoji('confident'),
        reason: 'High confidence in handling this request',
        confidence,
      }
    } else if (sentiment === 'positive') {
      return {
        emoji: this.getReactionEmoji('positive'),
        reason: 'Positive sentiment detected',
        confidence: 0.7,
      }
    } else if (sentiment === 'question') {
      return {
        emoji: this.getReactionEmoji('thinking'),
        reason: 'Question detected',
        confidence: 0.6,
      }
    }

    return null
  }

  remember(key: string, value: any, persistent = false): void {
    if (persistent) {
      this.memory.longTerm.set(key, value)
    } else {
      this.memory.shortTerm.set(key, value)
    }
  }

  recall(key: string): any {
    return this.memory.shortTerm.get(key) || this.memory.longTerm.get(key)
  }

  forget(key: string): void {
    this.memory.shortTerm.delete(key)
    this.memory.longTerm.delete(key)
  }

  async delegateTo(agentId: string, task: string): Promise<AgentResponse> {
    // This will be implemented by AgentTeam
    Logger.info(`${this.name} delegating to ${agentId}: ${task}`)
    return {
      content: `Task delegated to ${agentId}`,
      confidence: 1,
    }
  }

  async consultWith(agentId: string, question: string): Promise<string> {
    // This will be implemented by AgentTeam
    Logger.info(`${this.name} consulting with ${agentId}: ${question}`)
    return `Consultation with ${agentId}`
  }

  shouldInterrupt(context: ConversationContext): boolean {
    // Check if agent should naturally join conversation
    const keywords = this.getKeywords()
    const messageText = context.messages[context.messages.length - 1]?.body || ''
    
    // Check for keywords
    for (const keyword of keywords) {
      if (messageText.toLowerCase().includes(keyword.toLowerCase())) {
        return true
      }
    }

    // Check for confusion or questions
    if (messageText.includes('?') || messageText.includes('help')) {
      return this.capabilities.text
    }

    return false
  }

  getTypingDuration(responseLength: number): number {
    // Calculate realistic typing duration
    const baseTime = 1000 // 1 second minimum
    const charTime = 20 // 20ms per character
    const thinkingTime = this.personality.traits.verbosity * 2000 // More verbose = more thinking
    
    return Math.min(baseTime + (responseLength * charTime) + thinkingTime, 10000) // Max 10 seconds
  }

  formatResponse(content: string, _context: ConversationContext): string {
    // Add personality to response
    let formatted = content

    // Add emoji based on personality
    if (Math.random() < this.personality.traits.humor) {
      formatted = this.addEmoji(formatted)
    }

    // Add catchphrase occasionally
    if (Math.random() < 0.2) {
      const catchphrase = this.personality.catchPhrases[
        Math.floor(Math.random() * this.personality.catchPhrases.length)
      ]
      formatted = `${formatted}\n\n${catchphrase}`
    }

    return formatted
  }

  // Helper methods
  protected abstract getKeywords(): string[]

  protected getReactionEmoji(type: string): string {
    const reactions: Record<string, string[]> = {
      thinking: ['🤔', '💭', '🧠'],
      confident: ['💪', '✅', '🎯'],
      positive: ['😊', '👍', '🎉'],
      negative: ['😔', '😟', '😢'],
      confused: ['❓', '🤷', '😕'],
      working: ['⚙️', '🔧', '🛠️'],
      success: ['✅', '🎊', '🌟'],
    }

    const emojis = reactions[type] || ['👍']
    return emojis[Math.floor(Math.random() * emojis.length)]
  }

  protected addEmoji(text: string): string {
    const emojis = ['😊', '👍', '✨', '🚀', '💡', '🎯', '⚡', '🌟']
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    return `${text} ${emoji}`
  }

  protected async analyzeSentiment(text: string): Promise<string> {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'nice', 'love', 'thank', 'happy']
    const negativeWords = ['bad', 'terrible', 'hate', 'sad', 'angry', 'wrong', 'error']
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', '?']

    const lower = text.toLowerCase()

    for (const word of questionWords) {
      if (lower.includes(word)) return 'question'
    }

    for (const word of positiveWords) {
      if (lower.includes(word)) return 'positive'
    }

    for (const word of negativeWords) {
      if (lower.includes(word)) return 'negative'
    }

    return 'neutral'
  }

  protected buildPrompt(message: string, context: ConversationContext): string {
    return `You are ${this.name}, ${this.role}.
    
Personality traits:
- Formality: ${this.personality.traits.formality}
- Humor: ${this.personality.traits.humor}
- Verbosity: ${this.personality.traits.verbosity}
- Empathy: ${this.personality.traits.empathy}

Current context:
- Topic: ${context.topic}
- Mood: ${context.mood}
- Participants: ${context.participants.join(', ')}

Recent messages:
${context.messages.slice(-5).map(m => `${m.sender.pushname}: ${m.body}`).join('\n')}

User message: ${message}

Respond naturally and in character. Be helpful and engaging.`
  }
}