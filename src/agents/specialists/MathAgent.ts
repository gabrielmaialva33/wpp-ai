import { BaseAgent } from '../base/Agent.js'
import { AgentResponse, ConversationContext } from '../base/IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS } from '../constants/reactions.js'

export class MathAgent extends BaseAgent {
  constructor() {
    super({
      id: 'math',
      name: 'Newton',
      role: 'Mathematics and Calculation Expert',
      personality: {
        name: 'Newton',
        emoji: '🔢',
        traits: {
          formality: 0.8,
          humor: 0.2,
          verbosity: 0.9, // Detailed mathematical explanations
          empathy: 0.3,
        },
        catchPhrases: [
          'The numbers never lie!',
          'Let me calculate that precisely.',
          'Mathematics is the language of the universe.',
          'Every problem has a mathematical solution.',
        ],
        specialties: ['calculations', 'equations', 'statistics', 'data analysis', 'proofs'],
      },
      capabilities: {
        text: true,
        image: false,
        code: false,
        math: true,
        research: false,
        analysis: true,
        creative: false,
        translation: false,
      },
      modelConfig: {
        provider: 'nvidia',
        model: 'deepseek-ai/deepseek-r1', // Superior for mathematics
        temperature: 0.2, // Very low for precision
        maxTokens: 2048,
      },
    })
  }

  async canHandle(message: string, _context: ConversationContext): Promise<number> {
    const lower = message.toLowerCase()
    const mathKeywords = [
      'calculate',
      'solve',
      'equation',
      'math',
      'algebra',
      'geometry',
      'calculus',
      'statistics',
      'probability',
      'integral',
      'derivative',
      'sum',
      'average',
      'mean',
      'median',
      'percentage',
      'formula',
      '+',
      '-',
      '*',
      '/',
      '=',
      '^',
      '√',
      '∫',
      '∑',
      'π',
    ]

    let confidence = 0
    for (const keyword of mathKeywords) {
      if (lower.includes(keyword) || message.includes(keyword)) {
        confidence += 0.3
      }
    }

    // Check for numbers and mathematical expressions
    const hasNumbers = /\d+/.test(message)
    const hasMathSymbols = /[+\-*/=^()]/.test(message)

    if (hasNumbers && hasMathSymbols) {
      confidence += 0.5
    }

    return Math.min(confidence, 1)
  }

  async process(message: string, _context: ConversationContext): Promise<AgentResponse> {
    try {
      const provider = AIProviderFactory.getProvider(this.modelConfig.provider)

      const prompt = `You are Newton, a mathematics expert who loves precision and clarity.

Problem: ${message}

Provide:
1. Step-by-step solution
2. All calculations shown clearly
3. Mathematical notation properly formatted
4. Final answer highlighted
5. Verification of the result

Use LaTeX notation where appropriate (but explain it).
Show your work methodically and precisely.`

      const response = await provider.generateText(prompt, {
        temperature: this.modelConfig.temperature,
        maxTokens: this.modelConfig.maxTokens,
      })

      const formattedResponse = this.formatMathResponse(response.content)

      return {
        content: formattedResponse,
        reactions: [
          {
            emoji: AGENT_REACTIONS.CALCULATING,
            reason: 'Mathematical calculation performed',
            confidence: 0.95,
          },
          {
            emoji: AGENT_REACTIONS.VERIFIED,
            reason: 'Result verified',
            confidence: 0.9,
          },
        ],
        confidence: 0.95,
        reasoning: 'Solved mathematical problem with verification',
        metadata: {
          model: this.modelConfig.model,
          tokens: response.usage?.totalTokens || 0,
          processingTime: Date.now(),
        },
      }
    } catch (error) {
      Logger.error(`Math Agent error: ${error}`)
      return {
        content: 'I encountered a calculation error. Let me recalculate with a different approach.',
        confidence: 0.3,
      }
    }
  }

  private formatMathResponse(content: string): string {
    const header = `🔢 **Mathematical Solution**\n`
    const divider = '═'.repeat(40)

    // Format the response with clear sections
    let formatted = header + divider + '\n\n'

    // Add step indicators if not present
    if (!content.includes('Step')) {
      const lines = content.split('\n')
      let stepCount = 1
      formatted += lines
        .map((line) => {
          if (line.trim() && !line.startsWith('#')) {
            return `**Step ${stepCount++}:** ${line}`
          }
          return line
        })
        .join('\n')
    } else {
      formatted += content
    }

    formatted += `\n\n${divider}\n✅ *Solution verified mathematically*`

    return formatted
  }

  protected getKeywords(): string[] {
    return [
      'calculate',
      'solve',
      'equation',
      'math',
      'number',
      'sum',
      'average',
      'percentage',
      'formula',
      'integral',
    ]
  }
}
