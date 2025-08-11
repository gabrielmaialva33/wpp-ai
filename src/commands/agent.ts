import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AgentTeam } from '../agents/team/AgentTeam.js'
import { Logger } from '../utils/logger.js'

export const agent: ICommand = {
  name: 'agent',
  description: 'Fale diretamente com um agente específico',
  aliases: ['ag', 'bot'],
  usage: '!agent <nome_agente> <mensagem>',
  category: 'AI',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      if (args.length < 2) {
        await sendAgentHelp(client, message)
        return
      }

      const agentId = args[0].toLowerCase()
      const userMessage = args.slice(1).join(' ')

      const team = AgentTeam.getInstance()
      const agent = team.getAgent(agentId)

      if (!agent) {
        await client.sendText(
          message.from,
          `❌ Agente "${agentId}" não encontrado.\n\nAgentes disponíveis:\n${getAvailableAgentsList(team)}`,
          { quotedMsg: message.id }
        )
        return
      }

      // Send initial message with agent personality
      await client.sendText(
        message.from,
        `${agent.personality.emoji} **${agent.name}** está processando sua solicitação...`,
        { quotedMsg: message.id }
      )

      // Create a new message object with the user's actual message
      const processMessage = {
        ...message,
        body: userMessage,
      }

      // Process with specific agent
      await team.processMessage(client, processMessage, agentId)
    } catch (error) {
      Logger.error(`Agent command error: ${error}`)
      await client.sendText(
        message.from,
        '❌ Erro ao processar comando do agente. Tente novamente.',
        { quotedMsg: message.id }
      )
    }
  },
}

async function sendAgentHelp(client: Whatsapp, message: Message): Promise<void> {
  const team = AgentTeam.getInstance()
  const agents = team.getAgents()

  const help = `🤖 **Como usar o comando agent**
━━━━━━━━━━━━━━━━━━━━━━━━

**Formato:** !agent <nome> <mensagem>

**Exemplos:**
• !agent research encontre informações sobre IA
• !agent code crie uma função Python para ordenar lista
• !agent math resolva x² + 5x + 6 = 0

**Agentes disponíveis:**
${agents.map((a) => `• \`${a.id}\` - ${a.personality.emoji} ${a.name}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━
💡 Cada agente é especializado em diferentes tarefas!`

  await client.sendText(message.from, help, { quotedMsg: message.id })
}

function getAvailableAgentsList(team: AgentTeam): string {
  const agents = team.getAgents()
  return agents.map((a) => `• ${a.id} - ${a.personality.emoji} ${a.name}`).join('\n')
}
