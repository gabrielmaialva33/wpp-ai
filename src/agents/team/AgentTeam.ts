import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { BaseAgent } from '../base/Agent.js'
import { ConversationContext, AgentResponse } from '../base/IAgent.js'
import { OrchestratorAgent } from '../specialists/OrchestratorAgent.js'
import { ResearchAgent } from '../specialists/ResearchAgent.js'
import { CodeAgent } from '../specialists/CodeAgent.js'
import { MathAgent } from '../specialists/MathAgent.js'
import { CreativeAgent } from '../specialists/CreativeAgent.js'
import { VisualAgent } from '../specialists/VisualAgent.js'
import { Logger } from '../../utils/logger.js'
import { AGENT_REACTIONS, ReactionManager } from '../constants/reactions.js'

export class AgentTeam {
  private static instance: AgentTeam
  private orchestrator: OrchestratorAgent
  private agents: Map<string, BaseAgent>
  private activeConversations: Map<string, ConversationContext>
  // private reactionQueue: Map<string, Set<string>> // messageId -> agentIds

  private constructor() {
    this.agents = new Map()
    this.activeConversations = new Map()
    // this.reactionQueue = new Map()
    this.orchestrator = new OrchestratorAgent()
    this.initializeAgents()
  }

  static getInstance(): AgentTeam {
    if (!AgentTeam.instance) {
      AgentTeam.instance = new AgentTeam()
    }
    return AgentTeam.instance
  }

  private async initializeAgents(): Promise<void> {
    // Initialize all specialist agents
    const specialists = [
      new ResearchAgent(),
      new CodeAgent(),
      new MathAgent(),
      new CreativeAgent(),
      new VisualAgent(),
    ]

    for (const agent of specialists) {
      await agent.initialize()
      this.agents.set(agent.id, agent)
      this.orchestrator.registerSpecialist(agent)
      Logger.info(`Initialized agent: ${agent.name} (${agent.id})`)
    }

    await this.orchestrator.initialize()
    Logger.info('Agent Team initialized successfully')
  }

  async processMessage(
    client: Whatsapp,
    message: Message,
    directAgent?: string
  ): Promise<void> {
    try {
      const context = await this.getOrCreateContext(message)
      
      // Add reactions to show processing
      await this.addReaction(client, message, AGENT_REACTIONS.THINKING)

      let response: AgentResponse

      if (directAgent && this.agents.has(directAgent)) {
        // Direct agent request
        const agent = this.agents.get(directAgent)!
        await this.addReaction(client, message, agent.personality.emoji as any)
        response = await agent.process(message.body || '', context)
      } else {
        // Let orchestrator decide
        await this.addReaction(client, message, AGENT_REACTIONS.LEADER)
        response = await this.orchestrator.process(message.body || '', context)
      }

      // Send typing indicator
      const typingDuration = this.calculateTypingDuration(response.content)
      await client.startTyping(message.from, typingDuration)

      // Add success reaction
      await this.addReaction(client, message, AGENT_REACTIONS.SUCCESS)

      // Send the response
      await client.sendText(message.from, response.content, {
        quotedMsg: message.id,
      })

      // Update conversation context
      this.updateContext(message.from, message, response)

    } catch (error) {
      Logger.error(`AgentTeam error: ${error}`)
      await this.addReaction(client, message, AGENT_REACTIONS.ERROR)
      await client.sendText(
        message.from,
        '❌ Ops! Encontrei um problema ao processar sua mensagem. Vou tentar novamente.',
        { quotedMsg: message.id }
      )
    }
  }

  async shouldAgentsIntervene(message: Message): Promise<boolean> {
    const context = await this.getOrCreateContext(message)
    
    // Check if any agent wants to naturally join the conversation
    for (const agent of this.agents.values()) {
      if (agent.shouldInterrupt(context)) {
        return true
      }
    }

    // Check for confusion or help requests
    const messageText = message.body?.toLowerCase() || ''
    const needsHelp = 
      messageText.includes('?') ||
      messageText.includes('help') ||
      messageText.includes('ajuda') ||
      messageText.includes('não entendi') ||
      messageText.includes('confused')

    return needsHelp
  }

  async addNaturalResponse(
    client: Whatsapp,
    message: Message
  ): Promise<void> {
    const context = await this.getOrCreateContext(message)
    
    // Find the most confident agent for natural response
    let bestAgent: BaseAgent | null = null
    let bestConfidence = 0

    for (const agent of this.agents.values()) {
      const confidence = await agent.canHandle(message.body || '', context)
      if (confidence > bestConfidence) {
        bestConfidence = confidence
        bestAgent = agent
      }
    }

    if (bestAgent && bestConfidence > 0.5) {
      // Add thinking reaction
      await this.addReaction(client, message, AGENT_REACTIONS.THINKING_FACE)
      
      // Natural delay (1-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      // Process with the best agent
      const response = await bestAgent.process(message.body || '', context)
      
      // Format as natural intervention
      const naturalResponse = this.formatNaturalResponse(bestAgent, response.content)
      
      await client.sendText(message.from, naturalResponse)
    }
  }

  private formatNaturalResponse(agent: BaseAgent, content: string): string {
    const intros = [
      `${agent.personality.emoji} Ei, posso ajudar com isso!`,
      `${agent.personality.emoji} Deixa eu dar uma dica...`,
      `${agent.personality.emoji} Interessante! Sobre isso...`,
      `${agent.personality.emoji} Ah, eu sei algo sobre isso!`,
    ]

    const intro = intros[Math.floor(Math.random() * intros.length)]
    return `${intro}\n\n${content}`
  }

  private async addReaction(
    client: Whatsapp,
    message: Message,
    reaction: string
  ): Promise<void> {
    try {
      // WhatsApp reaction API
      await (client as any).sendReactionToMessage(message.id, reaction)
      
      // Track reaction internally
      ReactionManager.addReaction(message.id, {
        type: Object.keys(AGENT_REACTIONS).find(
          key => AGENT_REACTIONS[key as keyof typeof AGENT_REACTIONS] === reaction
        ) as any,
        agent: 'team',
        reason: 'Processing',
        timestamp: Date.now(),
      })
    } catch (error) {
      Logger.debug(`Could not add reaction: ${error}`)
    }
  }

  private async getOrCreateContext(message: Message): Promise<ConversationContext> {
    const groupId = message.from
    
    if (!this.activeConversations.has(groupId)) {
      this.activeConversations.set(groupId, {
        messages: [],
        topic: '',
        participants: [],
        mood: 'neutral',
        language: 'pt-BR',
        groupId,
      })
    }

    const context = this.activeConversations.get(groupId)!
    
    // Update context with new message
    context.messages.push(message)
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20) // Keep last 20 messages
    }

    // Update participants
    if (message.sender?.pushname) {
      if (!context.participants.includes(message.sender.pushname)) {
        context.participants.push(message.sender.pushname)
      }
    }

    // Detect topic (simple implementation)
    if (!context.topic && message.body) {
      context.topic = this.extractTopic(message.body)
    }

    return context
  }

  private updateContext(
    groupId: string,
    _message: Message,
    response: AgentResponse
  ): void {
    const context = this.activeConversations.get(groupId)
    if (context) {
      // Update mood based on response confidence
      if (response.confidence > 0.8) {
        context.mood = 'positive'
      } else if (response.confidence < 0.4) {
        context.mood = 'negative'
      }

      // Store in agent memory
      this.orchestrator.remember(`last_response_${groupId}`, response)
    }
  }

  private extractTopic(text: string): string {
    // Simple topic extraction
    const words = text.split(' ').filter(w => w.length > 4)
    return words.slice(0, 3).join(' ')
  }

  private calculateTypingDuration(text: string): number {
    const baseTime = 1000
    const perChar = 20
    const maxTime = 8000
    
    return Math.min(baseTime + (text.length * perChar), maxTime)
  }

  // Public methods for command access
  getAgents(): BaseAgent[] {
    return Array.from(this.agents.values())
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id)
  }

  getOrchestrator(): OrchestratorAgent {
    return this.orchestrator
  }
}