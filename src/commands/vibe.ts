import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
// import { AgentTeam } from '../agents/team/AgentTeam.js'
import { AIProviderFactory } from '../infrastructure/ai/AIProviderFactory.js'
import { Logger } from '../utils/logger.js'

export const vibe: ICommand = {
  name: 'vibe',
  description: 'Analisa o clima e humor do grupo',
  aliases: ['mood', 'clima', 'humor'],
  usage: '!vibe ou !vibe check',
  category: 'Fun',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return

    try {
      // Get recent messages from the chat
      const chat = await client.getChatById(message.from)
      // @ts-ignore
      const messages = await chat.fetchMessages({ limit: 50 })
      
      if (!messages || messages.length === 0) {
        await client.sendText(
          message.from,
          '😅 Não consegui analisar o vibe... o grupo está muito quieto!',
          { quotedMsg: message.id }
        )
        return
      }

      // Analyze the vibe
      await client.sendText(
        message.from,
        '🔮 Analisando o vibe do grupo...',
        { quotedMsg: message.id }
      )

      const vibeAnalysis = await analyzeGroupVibe(messages)
      
      // Send vibe report with reactions
      const vibeReport = formatVibeReport(vibeAnalysis)
      
      await client.sendText(message.from, vibeReport, { quotedMsg: message.id })

      // Add appropriate reaction based on vibe
      const vibeEmoji = getVibeEmoji(vibeAnalysis.overall)
      // @ts-ignore
      await client.sendReactionToMessage(message.id, vibeEmoji)

    } catch (error) {
      Logger.error(`Vibe command error: ${error}`)
      await client.sendText(
        message.from,
        '❌ Não consegui sentir o vibe... tente novamente!',
        { quotedMsg: message.id }
      )
    }
  },
}

interface VibeAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed' | 'chaotic'
  energy: number // 0-100
  topics: string[]
  emotions: {
    happiness: number
    excitement: number
    sadness: number
    anger: number
    confusion: number
  }
  activeUsers: string[]
  quietUsers: string[]
  recommendation: string
}

async function analyzeGroupVibe(messages: Message[]): Promise<VibeAnalysis> {
  try {
    await AIProviderFactory.initialize()
    const provider = await AIProviderFactory.getDefaultTextProvider()

    // Extract message content for analysis
    const recentMessages = messages
      .filter(m => m.body && m.type === MessageType.CHAT)
      .slice(0, 30)
      .map(m => ({
        sender: m.sender?.pushname || 'Unknown',
        text: m.body,
        timestamp: m.timestamp,
      }))

    const prompt = `Analyze the vibe/mood of this group chat based on recent messages.

Messages:
${recentMessages.map(m => `${m.sender}: ${m.text}`).join('\n')}

Provide a JSON analysis with:
{
  "overall": "positive/negative/neutral/mixed/chaotic",
  "energy": 0-100,
  "topics": ["main topics discussed"],
  "emotions": {
    "happiness": 0-100,
    "excitement": 0-100,
    "sadness": 0-100,
    "anger": 0-100,
    "confusion": 0-100
  },
  "recommendation": "suggestion to improve or maintain the vibe"
}

Be fun and insightful in your analysis!`

    const response = await provider.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 512,
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      
      // Identify active and quiet users
      const userMessageCount = new Map<string, number>()
      recentMessages.forEach(m => {
        const count = userMessageCount.get(m.sender) || 0
        userMessageCount.set(m.sender, count + 1)
      })

      const sortedUsers = Array.from(userMessageCount.entries())
        .sort((a, b) => b[1] - a[1])

      analysis.activeUsers = sortedUsers.slice(0, 3).map(([user]) => user)
      analysis.quietUsers = sortedUsers.slice(-2).map(([user]) => user)

      return analysis
    }
  } catch (error) {
    Logger.error(`Vibe analysis error: ${error}`)
  }

  // Fallback analysis
  return {
    overall: 'neutral',
    energy: 50,
    topics: ['conversas gerais'],
    emotions: {
      happiness: 50,
      excitement: 30,
      sadness: 10,
      anger: 5,
      confusion: 20,
    },
    activeUsers: [],
    quietUsers: [],
    recommendation: 'Continuem conversando e compartilhando boas vibes!',
  }
}

function formatVibeReport(analysis: VibeAnalysis): string {
  const vibeEmoji = getVibeEmoji(analysis.overall)
  const energyBar = createEnergyBar(analysis.energy)
  
  const emotionBars = Object.entries(analysis.emotions)
    .map(([emotion, value]) => {
      const emoji = getEmotionEmoji(emotion)
      const bar = createMiniBar(value)
      return `${emoji} ${emotion}: ${bar} ${value}%`
    })
    .join('\n')

  const report = `${vibeEmoji} **VIBE CHECK DO GRUPO** ${vibeEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━

**Vibe Geral:** ${analysis.overall.toUpperCase()}
**Energia:** ${energyBar} ${analysis.energy}%

**Emoções Detectadas:**
${emotionBars}

**Tópicos Quentes:** 
${analysis.topics.map(t => `• ${t}`).join('\n')}

${analysis.activeUsers.length > 0 ? `**Mais Ativos:** ${analysis.activeUsers.join(', ')}` : ''}
${analysis.quietUsers.length > 0 ? `**Mais Quietinhos:** ${analysis.quietUsers.join(', ')}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
💡 **Recomendação:** ${analysis.recommendation}`

  return report
}

function getVibeEmoji(vibe: string): string {
  const vibeEmojis: Record<string, string> = {
    positive: '😄',
    negative: '😔',
    neutral: '😐',
    mixed: '🤔',
    chaotic: '🤪',
  }
  return vibeEmojis[vibe] || '😊'
}

function getEmotionEmoji(emotion: string): string {
  const emotionEmojis: Record<string, string> = {
    happiness: '😊',
    excitement: '🎉',
    sadness: '😢',
    anger: '😠',
    confusion: '😕',
  }
  return emotionEmojis[emotion] || '😐'
}

function createEnergyBar(energy: number): string {
  const filled = Math.round(energy / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

function createMiniBar(value: number): string {
  const filled = Math.round(value / 20)
  const empty = 5 - filled
  return '▰'.repeat(filled) + '▱'.repeat(empty)
}