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

export interface AIVideoOptions {
  model?: string
  seed?: number
  cfgScale?: number
  /** Base image width/height enforced pela API (ex: 1024x576). */
  width?: number
  height?: number
}

export interface AIVideoResponse {
  base64: string // mp4 base64
  model: string
  seed?: number
  cost?: number
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
    video?: boolean
    vision?: boolean
  }

  generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse>
  generateImage?(prompt: string, options?: AIImageOptions): Promise<AIImageResponse>
  generateEmbedding?(text: string): Promise<number[]>
  generateVideo?(
    imageBase64: string,
    prompt?: string,
    options?: AIVideoOptions
  ): Promise<AIVideoResponse>
  analyzeImage?(params: { imageBase64: string; prompt?: string }): Promise<AIResponse>
  estimateCost?(tokens: number, type: 'input' | 'output'): number
  checkAvailability(): Promise<boolean>
}
