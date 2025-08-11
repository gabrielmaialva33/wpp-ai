import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import {
  IAIProvider,
  AIGenerationOptions,
  AIResponse,
  AIImageOptions,
  AIImageResponse,
} from '../core/interfaces/IAIProvider.js'
import { Env } from '../env.js'
import { Logger } from '../utils/logger.js'

export class GeminiProvider implements IAIProvider {
  name = 'gemini'
  private client: GoogleGenerativeAI

  supportedModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']

  capabilities = {
    text: true,
    image: false,
    embedding: true,
    functionCalling: true,
  }

  private modelConfigs = {
    'gemini-2.5-pro': {
      rpm: 150,
      inputCost: 1.25,
      outputCost: 10.0,
      maxTokens: 200000,
    },
    'gemini-2.5-flash': {
      rpm: 1000,
      inputCost: 0.3,
      outputCost: 2.5,
      maxTokens: 1000000,
    },
    'gemini-1.5-pro': {
      rpm: 150,
      inputCost: 3.5,
      outputCost: 10.5,
      maxTokens: 128000,
    },
    'gemini-1.5-flash': {
      rpm: 1000,
      inputCost: 0.075,
      outputCost: 0.3,
      maxTokens: 1000000,
    },
  }

  constructor() {
    this.client = new GoogleGenerativeAI(Env.GEMINI_API_KEY)
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    try {
      const modelName = options?.model || 'gemini-2.5-flash'
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          topP: options?.topP || 0.95,
          maxOutputTokens: options?.maxTokens || 1024,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      })

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Calculate usage
      const usage = response.usageMetadata
      const inputTokens = usage?.promptTokenCount || 0
      const outputTokens = usage?.candidatesTokenCount || 0
      const totalTokens = usage?.totalTokenCount || 0

      // Calculate cost
      const config = this.modelConfigs[modelName as keyof typeof this.modelConfigs]
      const inputCost = (inputTokens / 1000000) * config.inputCost
      const outputCost = (outputTokens / 1000000) * config.outputCost

      Logger.info(
        `Gemini ${modelName} - Tokens: ${totalTokens} | Cost: $${(inputCost + outputCost).toFixed(4)}`
      )

      return {
        content: text,
        model: modelName,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
        cost: {
          input: inputCost,
          output: outputCost,
          total: inputCost + outputCost,
        },
      }
    } catch (error) {
      Logger.error(`Gemini generation error: ${error}`)
      throw error
    }
  }

  async generateImage(_prompt: string, _options?: AIImageOptions): Promise<AIImageResponse> {
    throw new Error(
      'Gemini does not support image generation. Use NVIDIA or OpenAI provider instead.'
    )
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.client.getGenerativeModel({ model: 'embedding-001' })
      const result = await model.embedContent(text)
      return result.embedding.values
    } catch (error) {
      Logger.error(`Gemini embedding error: ${error}`)
      throw error
    }
  }

  estimateCost(tokens: number, type: 'input' | 'output', model = 'gemini-2.5-flash'): number {
    const config = this.modelConfigs[model as keyof typeof this.modelConfigs]
    const costPer1M = type === 'input' ? config.inputCost : config.outputCost
    return (tokens / 1000000) * costPer1M
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' })
      await model.generateContent('test')
      return true
    } catch {
      return false
    }
  }
}

export const Gemini = new GeminiProvider()
