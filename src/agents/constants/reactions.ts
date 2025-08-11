export const AGENT_REACTIONS = {
  // Processing States
  THINKING: '🤔',      // Agent is analyzing
  WORKING: '⚙️',       // Agent is processing
  SEARCHING: '🔍',     // Agent is researching
  WRITING: '✍️',       // Agent is composing
  CALCULATING: '🧮',   // Agent is computing
  ANALYZING: '📊',     // Agent is analyzing data
  
  // Emotions & Feedback
  UNDERSTOOD: '👍',    // Acknowledged message
  CONFUSED: '❓',      // Needs clarification
  EXCITED: '🎉',      // Found something interesting
  SURPRISED: '😮',     // Unexpected finding
  LAUGHING: '😂',      // Humor detected
  LOVE: '❤️',         // Positive sentiment
  SAD: '😢',          // Empathy response
  THINKING_FACE: '🧐', // Deep analysis
  MIND_BLOWN: '🤯',   // Amazing discovery
  
  // Content Type Indicators
  CODE: '💻',         // Code-related
  MATH: '🔢',         // Math problem
  CREATIVE: '🎨',     // Creative task
  DATA: '📊',         // Data analysis
  TRANSLATE: '🌐',    // Translation
  IMAGE: '🖼️',        // Visual content
  RESEARCH: '📚',     // Research task
  MUSIC: '🎵',        // Music-related
  GAME: '🎮',         // Gaming-related
  
  // Quality & Status Indicators
  VERIFIED: '✅',     // Information verified
  WARNING: '⚠️',      // Potential issue
  ERROR: '❌',        // Error detected
  SUCCESS: '🎯',      // Task completed
  GENIUS: '🧠',       // Complex reasoning
  ROCKET: '🚀',       // High performance
  FIRE: '🔥',         // Trending/Hot topic
  SPARKLES: '✨',     // Something special
  LIGHTNING: '⚡',    // Fast processing
  
  // Agent Specific
  LEADER: '👑',       // Orchestrator agent
  DETECTIVE: '🕵️',    // Research agent
  DEVELOPER: '👨‍💻',   // Code agent
  SCIENTIST: '👨‍🔬',   // Math agent
  ARTIST: '👨‍🎨',      // Creative agent
  DESIGNER: '👨‍🎨',    // Visual agent
  ANALYST: '👨‍💼',     // Analyst agent
  TRANSLATOR: '👨‍🏫',  // Language agent
} as const

export type ReactionType = keyof typeof AGENT_REACTIONS

export interface ReactionContext {
  type: ReactionType
  agent: string
  reason: string
  timestamp: number
}

export class ReactionManager {
  private static reactionHistory: Map<string, ReactionContext[]> = new Map()

  static addReaction(messageId: string, context: ReactionContext): void {
    if (!this.reactionHistory.has(messageId)) {
      this.reactionHistory.set(messageId, [])
    }
    this.reactionHistory.get(messageId)!.push(context)
  }

  static getReactions(messageId: string): ReactionContext[] {
    return this.reactionHistory.get(messageId) || []
  }

  static clearOldReactions(olderThan: number = 3600000): void {
    // Clear reactions older than 1 hour by default
    const now = Date.now()
    for (const [messageId, reactions] of this.reactionHistory.entries()) {
      const filtered = reactions.filter(r => now - r.timestamp < olderThan)
      if (filtered.length === 0) {
        this.reactionHistory.delete(messageId)
      } else {
        this.reactionHistory.set(messageId, filtered)
      }
    }
  }

  static getReactionEmoji(type: ReactionType): string {
    return AGENT_REACTIONS[type]
  }

  static getRandomReaction(category: 'positive' | 'negative' | 'neutral' | 'working'): string {
    const categories = {
      positive: ['LOVE', 'EXCITED', 'SUCCESS', 'FIRE', 'SPARKLES'],
      negative: ['SAD', 'WARNING', 'ERROR', 'CONFUSED'],
      neutral: ['UNDERSTOOD', 'THINKING', 'THINKING_FACE'],
      working: ['WORKING', 'SEARCHING', 'WRITING', 'CALCULATING', 'ANALYZING'],
    }

    const reactions = categories[category] as ReactionType[]
    const randomType = reactions[Math.floor(Math.random() * reactions.length)]
    return AGENT_REACTIONS[randomType]
  }
}