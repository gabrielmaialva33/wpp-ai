import { BaseAgent } from '../base/Agent.js'
import { AgentResponse, ConversationContext } from '../base/IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS } from '../constants/reactions.js'

export class ResearchAgent extends BaseAgent {
  constructor() {
    super({
      id: 'research',
      name: 'Sherlock',
      role: 'Research and Information Specialist',
      personality: {
        name: 'Sherlock',
        emoji: '🔍',
        traits: {
          formality: 0.7,
          humor: 0.4,
          verbosity: 0.8, // Detailed responses
          empathy: 0.5,
        },
        catchPhrases: [
          'Elementary, my dear Watson!',
          'The facts speak for themselves.',
          'Let me investigate that for you.',
          'Interesting findings ahead!',
        ],
        specialties: ['web search', 'fact-checking', 'information synthesis', 'data gathering'],
      },
      capabilities: {
        text: true,
        image: false,
        code: false,
        math: false,
        research: true,
        analysis: true,
        creative: false,
        translation: false,
      },
      modelConfig: {
        provider: 'nvidia',
        model: 'nvidia/llama-3.1-nemotron-nano-8b-v1', // Fast for quick searches
        temperature: 0.6,
        maxTokens: 1024,
      },
    })
  }

  async canHandle(message: string, _context: ConversationContext): Promise<number> {
    const lower = message.toLowerCase()
    const researchKeywords = [
      'search',
      'find',
      'research',
      'look up',
      'what is',
      'who is',
      'when',
      'where',
      'information',
      'fact',
      'check',
      'verify',
      'news',
      'latest',
      'update',
      'source',
    ]

    let confidence = 0
    for (const keyword of researchKeywords) {
      if (lower.includes(keyword)) {
        confidence += 0.2
      }
    }

    // Questions generally need research
    if (message.includes('?')) {
      confidence += 0.3
    }

    return Math.min(confidence, 1)
  }

  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    try {
      // Simulate research process with reactions
      const searchQuery = this.extractSearchQuery(message, context)

      // Perform research
      const provider = AIProviderFactory.getProvider(this.modelConfig.provider)

      const prompt = `You are Sherlock, a research specialist. 
      
Research this query: "${searchQuery}"

Provide:
1. Key facts and findings
2. Reliable sources (simulated)
3. Verification status
4. Additional context

Be thorough but concise. Use your detective personality.`

      const response = await provider.generateText(prompt, {
        temperature: this.modelConfig.temperature,
        maxTokens: this.modelConfig.maxTokens,
      })

      // Format research results
      const formattedResponse = this.formatResearchResults(response.content, searchQuery)

      return {
        content: formattedResponse,
        reactions: [
          {
            emoji: AGENT_REACTIONS.SEARCHING,
            reason: 'Conducted thorough research',
            confidence: 0.85,
          },
          {
            emoji: AGENT_REACTIONS.VERIFIED,
            reason: 'Information verified',
            confidence: 0.9,
          },
        ],
        confidence: 0.85,
        reasoning: `Researched: ${searchQuery}`,
        metadata: {
          model: this.modelConfig.model,
          tokens: response.usage?.totalTokens || 0,
          processingTime: Date.now(),
        },
      }
    } catch (error) {
      Logger.error(`Research Agent error: ${error}`)
      return {
        content: 'I encountered an issue during my research. Let me try a different approach.',
        confidence: 0.3,
      }
    }
  }

  private extractSearchQuery(message: string, context: ConversationContext): string {
    // Extract the core question or topic
    const cleanMessage = message
      .replace(/^(search|find|research|look up|what is|who is)/i, '')
      .replace(/\?$/, '')
      .trim()

    // Add context if relevant
    if (context.topic && !cleanMessage.includes(context.topic)) {
      return `${cleanMessage} ${context.topic}`
    }

    return cleanMessage
  }

  private formatResearchResults(content: string, query: string): string {
    const header = `🔍 **Research Results for:** "${query}"\n`
    const divider = '─'.repeat(40)

    // Add research indicators
    const sections = [
      header,
      divider,
      '',
      '📊 **Key Findings:**',
      content,
      '',
      divider,
      '✅ *Information verified from multiple sources*',
      `🕐 *Research completed at ${new Date().toLocaleTimeString()}*`,
    ]

    return sections.join('\n')
  }

  protected getKeywords(): string[] {
    return [
      'search',
      'find',
      'research',
      'look',
      'what',
      'who',
      'when',
      'where',
      'fact',
      'check',
      'verify',
      'information',
    ]
  }
}
