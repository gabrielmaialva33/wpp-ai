import { BaseAgent } from '../base/Agent.js'
import { AgentResponse, ConversationContext } from '../base/IAgent.js'
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS } from '../constants/reactions.js'

export class OrchestratorAgent extends BaseAgent {
  private specialists: Map<string, BaseAgent> = new Map()

  constructor() {
    super({
      id: 'orchestrator',
      name: 'Maestro',
      role: 'Orchestrator and Task Coordinator',
      personality: {
        name: 'Maestro',
        emoji: '🎯',
        traits: {
          formality: 0.8,
          humor: 0.3,
          verbosity: 0.6,
          empathy: 0.7,
        },
        catchPhrases: [
          'Let me coordinate that for you!',
          'I\'ll get the right expert on this.',
          'Teamwork makes the dream work!',
        ],
        specialties: ['task decomposition', 'agent coordination', 'response aggregation'],
      },
      capabilities: {
        text: true,
        image: false,
        code: false,
        math: false,
        research: false,
        analysis: true,
        creative: false,
        translation: false,
      },
      modelConfig: {
        provider: 'nvidia',
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        temperature: 0.7,
        maxTokens: 2048,
      },
    })
  }

  registerSpecialist(agent: BaseAgent): void {
    this.specialists.set(agent.id, agent)
    Logger.info(`Registered specialist: ${agent.name} (${agent.id})`)
  }

  async canHandle(message: string, context: ConversationContext): Promise<number> {
    // Orchestrator can handle any message that needs coordination
    const needsCoordination = 
      message.toLowerCase().includes('help') ||
      message.toLowerCase().includes('team') ||
      message.toLowerCase().includes('analyze') ||
      message.toLowerCase().includes('multiple') ||
      message.includes('&') || // Multiple tasks
      message.includes(' and ') || // Multiple tasks
      context.messages.length > 5 // Complex conversation

    return needsCoordination ? 0.9 : 0.3
  }

  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    try {
      // Analyze the task and determine which agents to involve
      const taskAnalysis = await this.analyzeTask(message, context)
      
      // If single agent is sufficient
      if (taskAnalysis.agents.length === 1) {
        const agent = this.specialists.get(taskAnalysis.agents[0])
        if (agent) {
          const response = await agent.process(message, context)
          return {
            ...response,
            content: `${agent.personality.emoji} **${agent.name}**: ${response.content}`,
            reactions: [
              {
                emoji: AGENT_REACTIONS.SUCCESS,
                reason: 'Task completed by specialist',
                confidence: response.confidence,
              },
            ],
          }
        }
      }

      // Multiple agents needed - coordinate them
      const responses = await this.coordinateAgents(taskAnalysis.agents, message, context)
      const aggregated = this.aggregateResponses(responses)

      return {
        content: this.formatCoordinatedResponse(taskAnalysis, aggregated),
        reactions: [
          {
            emoji: AGENT_REACTIONS.LEADER,
            reason: 'Coordinated multiple agents',
            confidence: 0.9,
          },
        ],
        suggestedAgents: taskAnalysis.agents,
        confidence: aggregated.confidence,
        reasoning: taskAnalysis.reasoning,
      }
    } catch (error) {
      Logger.error(`Orchestrator error: ${error}`)
      return {
        content: 'I encountered an issue coordinating the team. Let me try a different approach.',
        confidence: 0.3,
      }
    }
  }

  private async analyzeTask(message: string, context: ConversationContext): Promise<{
    agents: string[]
    reasoning: string
    tasks: { agent: string; task: string }[]
  }> {
    const provider = AIProviderFactory.getProvider(this.modelConfig.provider)
    
    const prompt = `Analyze this request and determine which specialist agents are needed.

Available agents:
- research: Web search, fact-checking, information gathering
- code: Programming, debugging, technical explanations
- math: Mathematical calculations, statistics, data analysis
- creative: Creative writing, storytelling, content generation
- visual: Image generation, visual descriptions
- analyst: Data analysis, report generation, insights
- language: Translation, language learning

Request: "${message}"

Context: ${context.topic}

Return a JSON response with:
{
  "agents": ["agent_id1", "agent_id2"],
  "reasoning": "Why these agents were selected",
  "tasks": [
    {"agent": "agent_id", "task": "specific task for this agent"}
  ]
}`

    const response = await provider.generateText(prompt, {
      temperature: 0.5,
      maxTokens: 512,
    })

    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      Logger.error(`Failed to parse task analysis: ${error}`)
    }

    // Fallback to simple analysis
    return {
      agents: this.simpleAgentSelection(message),
      reasoning: 'Automatic agent selection based on keywords',
      tasks: [],
    }
  }

  private simpleAgentSelection(message: string): string[] {
    const lower = message.toLowerCase()
    const agents: string[] = []

    if (lower.includes('code') || lower.includes('program') || lower.includes('debug')) {
      agents.push('code')
    }
    if (lower.includes('math') || lower.includes('calculate') || lower.includes('equation')) {
      agents.push('math')
    }
    if (lower.includes('search') || lower.includes('find') || lower.includes('research')) {
      agents.push('research')
    }
    if (lower.includes('write') || lower.includes('story') || lower.includes('creative')) {
      agents.push('creative')
    }
    if (lower.includes('image') || lower.includes('picture') || lower.includes('draw')) {
      agents.push('visual')
    }
    if (lower.includes('analyze') || lower.includes('data') || lower.includes('report')) {
      agents.push('analyst')
    }
    if (lower.includes('translate') || lower.includes('language')) {
      agents.push('language')
    }

    return agents.length > 0 ? agents : ['research'] // Default to research
  }

  private async coordinateAgents(
    agentIds: string[],
    message: string,
    context: ConversationContext
  ): Promise<Map<string, AgentResponse>> {
    const responses = new Map<string, AgentResponse>()

    // Process agents in parallel when possible
    const promises = agentIds.map(async (agentId) => {
      const agent = this.specialists.get(agentId)
      if (agent) {
        try {
          const response = await agent.process(message, context)
          responses.set(agentId, response)
        } catch (error) {
          Logger.error(`Agent ${agentId} failed: ${error}`)
        }
      }
    })

    await Promise.all(promises)
    return responses
  }

  private aggregateResponses(responses: Map<string, AgentResponse>): {
    content: string
    confidence: number
  } {
    const contents: string[] = []
    let totalConfidence = 0

    for (const [agentId, response] of responses) {
      const agent = this.specialists.get(agentId)
      if (agent) {
        contents.push(`**${agent.personality.emoji} ${agent.name}**:\n${response.content}`)
        totalConfidence += response.confidence
      }
    }

    return {
      content: contents.join('\n\n'),
      confidence: totalConfidence / responses.size,
    }
  }

  private formatCoordinatedResponse(
    taskAnalysis: { agents: string[]; reasoning: string },
    aggregated: { content: string; confidence: number }
  ): string {
    const header = `🎯 **Team Response** (${taskAnalysis.agents.length} agents collaborated)\n`
    const divider = '─'.repeat(40)
    
    return `${header}${divider}\n\n${aggregated.content}\n\n${divider}\n💡 *Coordination complete!*`
  }

  protected getKeywords(): string[] {
    return ['help', 'team', 'analyze', 'multiple', 'coordinate', 'agents']
  }
}