export interface AIGenerationOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  userId?: string
}

export interface AIImageOptions {
  model?: string
  width?: number
  height?: number
  samples?: number
  steps?: number
  seed?: number
  style?: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost?: {
    input: number
    output: number
    total: number
  }
}

export interface AIImageResponse {
  images: Array<{
    url?: string
    base64?: string
    mimeType?: string
  }>
  model: string
  cost?: number
}

export interface IAIProvider {
  name: string
  supportedModels: string[]
  capabilities: {
    text: boolean
    image: boolean
    embedding: boolean
    functionCalling: boolean
  }

  generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse>
  generateImage?(prompt: string, options?: AIImageOptions): Promise<AIImageResponse>
  generateEmbedding?(text: string): Promise<number[]>
  estimateCost?(tokens: number, type: 'input' | 'output'): number
  checkAvailability(): Promise<boolean>
}
