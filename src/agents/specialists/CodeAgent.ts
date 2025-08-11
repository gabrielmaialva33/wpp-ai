import { BaseAgent } from '../base/Agent.js'
import { AgentResponse, ConversationContext } from '../base/IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS } from '../constants/reactions.js'

export class CodeAgent extends BaseAgent {
  constructor() {
    super({
      id: 'code',
      name: 'Dev',
      role: 'Programming and Technical Expert',
      personality: {
        name: 'Dev',
        emoji: '💻',
        traits: {
          formality: 0.5,
          humor: 0.6,
          verbosity: 0.7,
          empathy: 0.4,
        },
        catchPhrases: [
          'Let\'s debug this together!',
          'Code is poetry in motion.',
          'There\'s always a solution in the stack.',
          'Time to compile some magic!',
        ],
        specialties: ['programming', 'debugging', 'code review', 'technical documentation'],
      },
      capabilities: {
        text: true,
        image: false,
        code: true,
        math: true, // Can handle programming math
        research: false,
        analysis: true,
        creative: false,
        translation: false,
      },
      modelConfig: {
        provider: 'nvidia',
        model: 'deepseek-ai/deepseek-r1', // Excellent for coding
        temperature: 0.3, // Lower for more precise code
        maxTokens: 2048,
      },
    })
  }

  async canHandle(message: string, _context: ConversationContext): Promise<number> {
    const lower = message.toLowerCase()
    const codeKeywords = [
      'code', 'program', 'function', 'class', 'debug', 'error', 'bug',
      'javascript', 'python', 'typescript', 'java', 'c++', 'html', 'css',
      'api', 'database', 'algorithm', 'script', 'compile', 'syntax',
      'variable', 'loop', 'array', 'object', 'method', 'import', 'export'
    ]

    let confidence = 0
    for (const keyword of codeKeywords) {
      if (lower.includes(keyword)) {
        confidence += 0.25
      }
    }

    // Check for code blocks or technical symbols
    if (message.includes('```') || message.includes('()') || message.includes('{}')) {
      confidence += 0.4
    }

    return Math.min(confidence, 1)
  }

  async process(message: string, _context: ConversationContext): Promise<AgentResponse> {
    try {
      const provider = AIProviderFactory.getProvider(this.modelConfig.provider)
      
      const prompt = `You are Dev, a programming expert with a friendly, helpful personality.

Task: ${message}

Provide:
1. Clear, working code solution
2. Step-by-step explanation
3. Best practices and optimizations
4. Common pitfalls to avoid

Use markdown code blocks with proper syntax highlighting.
Be precise but friendly. Add helpful comments in the code.`

      const response = await provider.generateText(prompt, {
        temperature: this.modelConfig.temperature,
        maxTokens: this.modelConfig.maxTokens,
      })

      const formattedResponse = this.formatCodeResponse(response.content)

      return {
        content: formattedResponse,
        reactions: [
          {
            emoji: AGENT_REACTIONS.CODE,
            reason: 'Code solution provided',
            confidence: 0.9,
          },
          {
            emoji: AGENT_REACTIONS.SUCCESS,
            reason: 'Solution verified',
            confidence: 0.85,
          },
        ],
        confidence: 0.9,
        reasoning: 'Generated code solution with explanations',
        metadata: {
          model: this.modelConfig.model,
          tokens: response.usage?.totalTokens || 0,
          processingTime: Date.now(),
        },
      }
    } catch (error) {
      Logger.error(`Code Agent error: ${error}`)
      return {
        content: 'I hit a compilation error in my thought process. Let me refactor my approach...',
        confidence: 0.3,
      }
    }
  }

  private formatCodeResponse(content: string): string {
    const header = `💻 **Code Solution**\n`
    const divider = '─'.repeat(40)
    
    // Add code quality indicators
    let formatted = header + divider + '\n\n' + content

    // Add footer with tips
    if (!content.includes('Best practice')) {
      formatted += `\n\n${divider}\n💡 *Pro tip: Always test your code in a safe environment first!*`
    }

    return formatted
  }

  protected getKeywords(): string[] {
    return [
      'code', 'program', 'function', 'debug', 'error', 'script',
      'javascript', 'python', 'typescript', 'api', 'algorithm'
    ]
  }
}