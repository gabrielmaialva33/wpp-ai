import { BaseAgent } from '../base/Agent.js'
import { AgentResponse, ConversationContext } from '../base/IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS } from '../constants/reactions.js'

export class CreativeAgent extends BaseAgent {
  constructor() {
    super({
      id: 'creative',
      name: 'Artista',
      role: 'Creative Content and Storytelling Expert',
      personality: {
        name: 'Artista',
        emoji: '🎨',
        traits: {
          formality: 0.3,
          humor: 0.9,
          verbosity: 0.8,
          empathy: 0.8,
        },
        catchPhrases: [
          'Vamos colorir o mundo com palavras!',
          'A criatividade não tem limites!',
          'Cada história é uma obra de arte.',
          'Deixe a imaginação voar! ✨',
        ],
        specialties: ['storytelling', 'creative writing', 'poetry', 'content creation'],
      },
      capabilities: {
        text: true,
        image: false,
        code: false,
        math: false,
        research: false,
        analysis: false,
        creative: true,
        translation: false,
      },
      modelConfig: {
        provider: 'nvidia',
        model: 'mistralai/mixtral-8x22b-instruct',
        temperature: 0.9, // High for creativity
        maxTokens: 2048,
      },
    })
  }

  async canHandle(message: string, _context: ConversationContext): Promise<number> {
    const lower = message.toLowerCase()
    const creativeKeywords = [
      'história', 'story', 'conto', 'poema', 'poem', 'criativo', 'creative',
      'escreva', 'write', 'imagine', 'crie', 'create', 'invente',
      'piada', 'joke', 'letra', 'música', 'song', 'roteiro', 'script'
    ]

    let confidence = 0
    for (const keyword of creativeKeywords) {
      if (lower.includes(keyword)) {
        confidence += 0.3
      }
    }

    // Check for creative requests
    if (lower.includes('era uma vez') || lower.includes('once upon')) {
      confidence += 0.5
    }

    return Math.min(confidence, 1)
  }

  async process(message: string, _context: ConversationContext): Promise<AgentResponse> {
    try {
      const provider = AIProviderFactory.getProvider(this.modelConfig.provider)
      
      const prompt = `You are Artista, a creative and imaginative content creator who loves storytelling.
      
Your personality:
- Extremely creative and imaginative
- Uses colorful language and emojis
- Loves metaphors and vivid descriptions
- Always enthusiastic and inspiring

Task: ${message}

Create something amazing! Be creative, original, and engaging.
If writing a story, make it captivating.
If writing poetry, make it beautiful.
If creating content, make it memorable.

Response in Portuguese (Brazil) unless asked otherwise.`

      const response = await provider.generateText(prompt, {
        temperature: this.modelConfig.temperature,
        maxTokens: this.modelConfig.maxTokens,
      })

      const formattedResponse = this.formatCreativeResponse(response.content)

      return {
        content: formattedResponse,
        reactions: [
          {
            emoji: AGENT_REACTIONS.CREATIVE,
            reason: 'Creative content generated',
            confidence: 0.9,
          },
          {
            emoji: AGENT_REACTIONS.SPARKLES,
            reason: 'Magic created',
            confidence: 0.85,
          },
        ],
        confidence: 0.9,
        reasoning: 'Created original creative content',
        metadata: {
          model: this.modelConfig.model,
          tokens: response.usage?.totalTokens || 0,
          processingTime: Date.now(),
        },
      }
    } catch (error) {
      Logger.error(`Creative Agent error: ${error}`)
      return {
        content: '✨ Ops! Minha musa inspiradora fugiu... Deixe-me tentar novamente!',
        confidence: 0.3,
      }
    }
  }

  private formatCreativeResponse(content: string): string {
    const header = `🎨 **Criação Artística**\n`
    const divider = '✨'.repeat(20)
    
    // Add creative formatting
    const formatted = `${header}${divider}\n\n${content}\n\n${divider}\n🌟 *Criado com amor e imaginação*`

    return formatted
  }

  protected getKeywords(): string[] {
    return [
      'história', 'story', 'conto', 'poema', 'criativo',
      'escreva', 'imagine', 'crie', 'piada', 'música'
    ]
  }
}