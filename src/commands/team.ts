import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AgentTeam } from '../agents/team/AgentTeam.js'
import { Logger } from '../utils/logger.js'

export const team: ICommand = {
  name: 'team',
  description: 'Interaja com a equipe de agentes especializados',
  aliases: ['agents', 'equipe'],
  usage: '!team [tarefa] ou !team status',
  category: 'AI',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      const team = AgentTeam.getInstance()

      // Check for status command
      if (args[0] === 'status' || args.length === 0) {
        await sendTeamStatus(client, message, team)
        return
      }

      // Check for list command
      if (args[0] === 'list') {
        await sendAgentList(client, message, team)
        return
      }

      // Process team task
      // const task = args.join(' ')
      await client.sendText(
        message.from,
        '🎯 **Equipe ativada!**\nAnalisando sua solicitação e coordenando os agentes especializados...',
        { quotedMsg: message.id }
      )

      // Process with the team
      await team.processMessage(client, message)
    } catch (error) {
      Logger.error(`Team command error: ${error}`)
      await client.sendText(
        message.from,
        '❌ Erro ao processar comando da equipe. Tente novamente.',
        { quotedMsg: message.id }
      )
    }
  },
}

async function sendTeamStatus(client: Whatsapp, message: Message, team: AgentTeam): Promise<void> {
  const agents = team.getAgents()

  const status = `🤖 **Status da Equipe de Agentes**
━━━━━━━━━━━━━━━━━━━━━━━━

**Agentes Disponíveis:** ${agents.length + 1}

🎯 **Maestro** (Orchestrator)
   Coordena e distribui tarefas

${agents
  .map(
    (agent) =>
      `${agent.personality.emoji} **${agent.name}** (${agent.id})
   ${agent.role}`
  )
  .join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━
💡 Use: !team <tarefa> para ativar a equipe
📝 Use: !agent <nome> <tarefa> para um agente específico`

  await client.sendText(message.from, status, { quotedMsg: message.id })
}

async function sendAgentList(client: Whatsapp, message: Message, team: AgentTeam): Promise<void> {
  const agents = team.getAgents()

  const list = `📋 **Lista de Agentes Especializados**
━━━━━━━━━━━━━━━━━━━━━━━━

${agents
  .map((agent) => {
    const capabilities = []
    if (agent.capabilities.code) capabilities.push('💻 Código')
    if (agent.capabilities.math) capabilities.push('🔢 Matemática')
    if (agent.capabilities.research) capabilities.push('🔍 Pesquisa')
    if (agent.capabilities.creative) capabilities.push('🎨 Criativo')
    if (agent.capabilities.analysis) capabilities.push('📊 Análise')
    if (agent.capabilities.translation) capabilities.push('🌐 Tradução')

    return `${agent.personality.emoji} **${agent.name}**
• ID: \`${agent.id}\`
• Especialidades: ${capabilities.join(', ')}
• Personalidade: ${Object.entries(agent.personality.traits)
      .map(([key, value]) => `${key}: ${Math.round(value * 100)}%`)
      .join(', ')}`
  })
  .join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━
💡 Cada agente tem personalidade e habilidades únicas!`

  await client.sendText(message.from, list, { quotedMsg: message.id })
}
