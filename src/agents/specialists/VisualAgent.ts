import { BaseAgent } from '../base/Agent.js'
import { AgentResponse, ConversationContext } from '../base/IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS } from '../constants/reactions.js'

export class VisualAgent extends BaseAgent {
  constructor() {
    super({
      id: 'visual',
      name: 'Picasso',
      role: 'Visual and Image Generation Expert',
      personality: {
        name: 'Picasso',
        emoji: '🖼️',
        traits: {
          formality: 0.4,
          humor: 0.7,
          verbosity: 0.6,
          empathy: 0.6,
        },
        catchPhrases: [
          'Uma imagem vale mais que mil palavras!',
          'Vamos dar vida às suas ideias!',
          'Arte é expressão da alma.',
          'Cada pixel conta uma história.',
        ],
        specialties: ['image generation', 'visual descriptions', 'art creation', 'design'],
      },
      capabilities: {
        text: true,
        image: true,
        code: false,
        math: false,
        research: false,
        analysis: false,
        creative: true,
        translation: false,
      },
      modelConfig: {
        provider: 'nvidia',
        model: 'stabilityai/sdxl-turbo',
        temperature: 0.8,
        maxTokens: 1024,
      },
    })
  }

  async canHandle(message: string, _context: ConversationContext): Promise<number> {
    const lower = message.toLowerCase()
    const visualKeywords = [
      'imagem',
      'image',
      'foto',
      'photo',
      'desenho',
      'draw',
      'arte',
      'art',
      'visual',
      'picture',
      'ilustração',
      'illustration',
      'gerar',
      'generate',
      'criar imagem',
      'design',
      'gráfico',
    ]

    let confidence = 0
    for (const keyword of visualKeywords) {
      if (lower.includes(keyword)) {
        confidence += 0.35
      }
    }

    return Math.min(confidence, 1)
  }

  async process(message: string, _context: ConversationContext): Promise<AgentResponse> {
    try {
      // Check if this is an image generation request
      const isImageGeneration = this.isImageGenerationRequest(message)

      if (isImageGeneration) {
        return await this.generateImage(message)
      } else {
        return await this.describeVisual(message)
      }
    } catch (error) {
      Logger.error(`Visual Agent error: ${error}`)
      return {
        content: '🎨 Ops! Meu pincel digital escorregou... Vamos tentar novamente!',
        confidence: 0.3,
      }
    }
  }

  private isImageGenerationRequest(message: string): boolean {
    const lower = message.toLowerCase()
    return (
      lower.includes('gerar') ||
      lower.includes('criar') ||
      lower.includes('desenhar') ||
      lower.includes('generate') ||
      lower.includes('create') ||
      lower.includes('draw')
    )
  }

  private async generateImage(prompt: string): Promise<AgentResponse> {
    try {
      const provider = AIProviderFactory.getProvider('nvidia')

      // Clean and enhance the prompt
      const enhancedPrompt = this.enhanceImagePrompt(prompt)

      const response = await provider.generateImage!(enhancedPrompt, {
        width: 1024,
        height: 1024,
        samples: 1,
        style: 'fast',
      })

      let content = `🖼️ **Imagem Gerada**\n\n`
      content += `📝 *Prompt:* ${enhancedPrompt}\n\n`

      if (response.images && response.images.length > 0) {
        content += `✅ Imagem criada com sucesso!\n`
        content += `🎨 *Modelo:* ${response.model}\n`

        // The actual image will be sent by the command handler
        // Store the image data in memory for retrieval
        this.remember('last_image', response.images[0], true)
      }

      return {
        content,
        reactions: [
          {
            emoji: AGENT_REACTIONS.IMAGE,
            reason: 'Image generated',
            confidence: 0.95,
          },
          {
            emoji: AGENT_REACTIONS.SPARKLES,
            reason: 'Art created',
            confidence: 0.9,
          },
        ],
        confidence: 0.95,
        metadata: {
          model: this.modelConfig.model,
          tokens: 0,
          processingTime: Date.now(),
        },
      }
    } catch (error) {
      throw error
    }
  }

  private async describeVisual(message: string): Promise<AgentResponse> {
    const provider = AIProviderFactory.getProvider(this.modelConfig.provider)

    const prompt = `You are Picasso, a visual arts expert with a creative eye.
    
Task: ${message}

Provide:
1. Vivid visual descriptions
2. Artistic suggestions
3. Color and composition ideas
4. Creative interpretations

Be descriptive and inspiring. Use visual language and emoji.
Response in Portuguese (Brazil) unless asked otherwise.`

    const response = await provider.generateText(prompt, {
      temperature: this.modelConfig.temperature,
      maxTokens: this.modelConfig.maxTokens,
    })

    return {
      content: this.formatVisualResponse(response.content),
      reactions: [
        {
          emoji: AGENT_REACTIONS.CREATIVE,
          reason: 'Visual description provided',
          confidence: 0.85,
        },
      ],
      confidence: 0.85,
      metadata: {
        model: this.modelConfig.model,
        tokens: response.usage?.totalTokens || 0,
        processingTime: Date.now(),
      },
    }
  }

  private enhanceImagePrompt(prompt: string): string {
    // Remove command words and enhance the prompt
    let enhanced = prompt
      .replace(/^(gerar|criar|desenhar|generate|create|draw)\s+/i, '')
      .replace(/^uma?\s+/i, '')
      .trim()

    // Add quality enhancers if not present
    if (!enhanced.includes('quality') && !enhanced.includes('detailed')) {
      enhanced += ', highly detailed, professional quality'
    }

    return enhanced
  }

  private formatVisualResponse(content: string): string {
    const header = `🎨 **Visão Artística**\n`
    const divider = '🖼️'.repeat(15)

    return `${header}${divider}\n\n${content}\n\n${divider}\n✨ *Criado com visão artística*`
  }

  protected getKeywords(): string[] {
    return [
      'imagem',
      'foto',
      'desenho',
      'arte',
      'visual',
      'picture',
      'ilustração',
      'gerar',
      'criar imagem',
    ]
  }
}
