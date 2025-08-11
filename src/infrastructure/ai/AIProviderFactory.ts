import { IAIProvider } from '../../core/interfaces/IAIProvider.js'
import { Env } from '../../env.js'
import { Logger } from '../../utils/logger.js'

export class AIProviderFactory {
  private static providers = new Map<string, IAIProvider>()
  private static initialized = false

  static async initialize() {
    if (this.initialized) return

    try {
      // Dynamically import providers based on available API keys
      if (Env.GEMINI_API_KEY) {
        const { Gemini } = await import('../../plugins/gemini.plugin.js')
        this.registerProvider('gemini', Gemini)
        Logger.info('Gemini provider registered')
      }

      if (Env.NVIDIA_API_KEY) {
        const { Nvidia } = await import('../../plugins/nvidia.plugin.js')
        this.registerProvider('nvidia', Nvidia)
        Logger.info('NVIDIA provider registered')
      }

      this.initialized = true
      Logger.info(`AI Provider Factory initialized with ${this.providers.size} providers`)
    } catch (error) {
      Logger.error(`Failed to initialize AI providers: ${error}`)
      throw error
    }
  }

  static registerProvider(name: string, provider: IAIProvider) {
    this.providers.set(name.toLowerCase(), provider)
  }

  static getProvider(name: string): IAIProvider {
    const provider = this.providers.get(name.toLowerCase())
    if (!provider) {
      const available = Array.from(this.providers.keys()).join(', ')
      throw new Error(`Provider "${name}" not found. Available providers: ${available}`)
    }
    return provider
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  static async selectBestProvider(
    task: 'text' | 'image' | 'embedding',
    requirements?: {
      maxCost?: number
      minSpeed?: 'fast' | 'medium' | 'slow'
      preferredProvider?: string
    }
  ): Promise<IAIProvider> {
    await this.initialize()

    // If preferred provider is specified and available, use it
    if (requirements?.preferredProvider) {
      try {
        const provider = this.getProvider(requirements.preferredProvider)
        if (provider.capabilities[task]) {
          const isAvailable = await provider.checkAvailability()
          if (isAvailable) return provider
        }
      } catch (error) {
        Logger.warn(`Preferred provider ${requirements.preferredProvider} not available: ${error}`)
      }
    }

    // Filter providers by capability
    const capableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.capabilities[task])
      .map(([name, provider]) => ({ name, provider }))

    if (capableProviders.length === 0) {
      throw new Error(`No providers available for task: ${task}`)
    }

    // Check availability and select the first available provider
    for (const { name, provider } of capableProviders) {
      try {
        const isAvailable = await provider.checkAvailability()
        if (isAvailable) {
          Logger.info(`Selected ${name} provider for ${task} task`)
          return provider
        }
      } catch (error) {
        Logger.warn(`Provider ${name} availability check failed: ${error}`)
      }
    }

    // If no provider is available, throw error
    throw new Error(`No available providers for task: ${task}`)
  }

  static async getDefaultTextProvider(): Promise<IAIProvider> {
    return this.selectBestProvider('text', {
      preferredProvider: Env.DEFAULT_TEXT_PROVIDER,
    })
  }

  static async getDefaultImageProvider(): Promise<IAIProvider> {
    return this.selectBestProvider('image', {
      preferredProvider: Env.DEFAULT_IMAGE_PROVIDER,
    })
  }

  static async compareProviders(
    prompt: string,
    providers: string[] = []
  ): Promise<Map<string, string>> {
    await this.initialize()

    const results = new Map<string, string>()
    const targetProviders = providers.length > 0 ? providers : this.getAvailableProviders()

    for (const providerName of targetProviders) {
      try {
        const provider = this.getProvider(providerName)
        if (!provider.capabilities.text) continue

        const response = await provider.generateText(prompt, {
          temperature: 0.7,
          maxTokens: 512,
        })

        results.set(providerName, response.content)
      } catch (error) {
        Logger.error(`Provider ${providerName} failed: ${error}`)
        results.set(providerName, `Error: ${error}`)
      }
    }

    return results
  }
}
