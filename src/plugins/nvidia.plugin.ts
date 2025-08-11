import fetch from 'node-fetch'
import {
  IAIProvider,
  AIGenerationOptions,
  AIResponse,
  AIImageOptions,
  AIImageResponse,
  AIVideoOptions,
  AIVideoResponse,
} from '../core/interfaces/IAIProvider.js'
import { Env } from '../env.js'
import { Logger } from '../utils/logger.js'

export class NvidiaProvider implements IAIProvider {
  name = 'nvidia'
  private apiKey: string
  private baseUrl = 'https://integrate.api.nvidia.com/v1'

  supportedModels = [
    // Text models
    'meta/llama-3.3-70b-instruct',
    'nvidia/llama-3.3-nemotron-super-49b-v1',
    'nvidia/llama-3.1-nemotron-nano-8b-v1',
    'deepseek-ai/deepseek-r1',
    'mistralai/mixtral-8x7b-instruct-v0.1',
    'google/gemma-3-27b-it',
    // Image models
    'stabilityai/sdxl-turbo',
    'stabilityai/stable-diffusion-xl-base-1.0',
  ]

  capabilities = {
    text: true,
    image: true,
    embedding: true,
    functionCalling: true,
    video: true,
    vision: true,
  }

  private modelConfigs = {
    'meta/llama-3.3-70b-instruct': {
      type: 'text',
      contextWindow: 128000,
      maxOutput: 4096,
    },
    'nvidia/llama-3.3-nemotron-super-49b-v1': {
      type: 'text',
      contextWindow: 200000,
      maxOutput: 8192,
    },
    'nvidia/llama-3.1-nemotron-nano-8b-v1': {
      type: 'text',
      contextWindow: 128000,
      maxOutput: 4096,
    },
    'deepseek-ai/deepseek-r1': {
      type: 'text',
      contextWindow: 64000,
      maxOutput: 8192,
    },
    'stabilityai/sdxl-turbo': {
      type: 'image',
      steps: 4,
      cfgScale: 1.0,
    },
    'stabilityai/stable-diffusion-xl-base-1.0': {
      type: 'image',
      steps: 50,
      cfgScale: 7.0,
    },
  }

  constructor() {
    this.apiKey = Env.NVIDIA_API_KEY
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    try {
      const modelName = options?.model || 'nvidia/llama-3.1-nemotron-nano-8b-v1'

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 0.95,
          max_tokens: options?.maxTokens || 1024,
          stream: options?.stream || false,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`NVIDIA API error: ${response.status} - ${error}`)
      }

      const data = (await response.json()) as any

      const content = data.choices[0].message.content
      const usage = data.usage

      Logger.info(`NVIDIA ${modelName} - Tokens: ${usage.total_tokens}`)

      return {
        content,
        model: modelName,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      }
    } catch (error) {
      Logger.error(`NVIDIA generation error: ${error}`)
      throw error
    }
  }

  async generateImage(prompt: string, options?: AIImageOptions): Promise<AIImageResponse> {
    try {
      const modelName = options?.model || 'stabilityai/sdxl-turbo'
      const config = this.modelConfigs[modelName as keyof typeof this.modelConfigs] as any

      const endpoint = modelName.includes('sdxl-turbo')
        ? '/genai/stabilityai/sdxl-turbo'
        : '/genai/stabilityai/stable-diffusion-xl-base-1-0'

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1.0,
            },
          ],
          cfg_scale: options?.style === 'fast' ? 1.0 : config.cfgScale || 5.0,
          width: options?.width || 1024,
          height: options?.height || 1024,
          samples: options?.samples || 1,
          steps: options?.steps || config.steps || 4,
          seed: options?.seed || Math.floor(Math.random() * 1000000),
          sampler: 'K_EULER',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`NVIDIA Image API error: ${response.status} - ${error}`)
      }

      const data = (await response.json()) as any

      Logger.info(`NVIDIA ${modelName} - Generated ${data.artifacts.length} image(s)`)

      return {
        images: data.artifacts.map((artifact: any) => ({
          base64: artifact.base64,
          mimeType: 'image/png',
        })),
        model: modelName,
      }
    } catch (error) {
      Logger.error(`NVIDIA image generation error: ${error}`)
      throw error
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: [text],
          model: 'nvidia/nv-embed-v1',
          encoding_format: 'float',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`NVIDIA Embedding API error: ${response.status} - ${error}`)
      }

      const data = (await response.json()) as any
      return data.data[0].embedding
    } catch (error) {
      Logger.error(`NVIDIA embedding error: ${error}`)
      throw error
    }
  }

  async generateVideo(
    imageBase64: string,
    _prompt?: string,
    options?: AIVideoOptions
  ): Promise<AIVideoResponse> {
    try {
      const modelEndpoint = '/genai/stabilityai/stable-video-diffusion'
      const response = await fetch(`${this.baseUrl}${modelEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64, // deve vir no formato data:image/png;base64,<...>
          seed: options?.seed || 0,
          cfg_scale: options?.cfgScale || 1.8,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`NVIDIA Video API error: ${response.status} - ${error}`)
      }

      const data = (await response.json()) as any
      if (!data.video) throw new Error('No video field in response')

      return {
        base64: data.video,
        model: 'stabilityai/stable-video-diffusion',
        seed: data.seed,
      }
    } catch (error) {
      Logger.error(`NVIDIA video generation error: ${error}`)
      throw error
    }
  }

  async analyzeImage(params: { imageBase64: string; prompt?: string }): Promise<AIResponse> {
    try {
      // Usar microsoft/florence-2 para descrição / Q&A de imagem
      const endpoint = '/vlm/microsoft/florence-2'
      const prompt = params.prompt || 'Describe the image briefly in Portuguese.'
      const messages = [
        {
          role: 'user',
          content: `<img src="${params.imageBase64}" />\n${prompt}`,
        },
      ]
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, max_tokens: 512 }),
      })
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`NVIDIA Vision API error: ${response.status} - ${error}`)
      }
      const data = (await response.json()) as any
      const content = data?.choices?.[0]?.message?.content || 'Sem descrição.'
      return {
        content,
        model: 'microsoft/florence-2',
      }
    } catch (error) {
      Logger.error(`NVIDIA vision analyze error: ${error}`)
      throw error
    }
  }

  estimateCost(_tokens: number, _type: 'input' | 'output'): number {
    // NVIDIA NIM pricing varies by deployment model
    // This is a placeholder - actual costs depend on your infrastructure
    return 0
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export const Nvidia = new NvidiaProvider()
