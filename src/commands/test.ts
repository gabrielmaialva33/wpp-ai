import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { AgentTeam } from '../agents/team/AgentTeam.js'
import { Logger } from '../utils/logger.js'

export const test: ICommand = {
  name: 'test',
  description: 'Testa funcionalidades do sistema multi-agente',
  aliases: ['teste', 'demo'],
  usage: '!test [feature]',
  category: 'Debug',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      const feature = args[0]?.toLowerCase() || 'basic'

      switch (feature) {
        case 'basic':
          await testBasicFeatures(client, message)
          break

        case 'agents':
          await testAllAgents(client, message)
          break

        case 'reactions':
          await testReactions(client, message)
          break

        case 'team':
          await testTeamCollaboration(client, message)
          break

        default:
          await sendTestHelp(client, message)
      }
    } catch (error) {
      Logger.error(`Test command error: ${error}`)
      await client.sendText(
        message.from,
        '❌ Erro durante o teste. Verifique o console para mais detalhes.',
        { quotedMsg: message.id }
      )
    }
  },
}

async function testBasicFeatures(client: Whatsapp, message: Message): Promise<void> {
  await client.sendText(
    message.from,
    '🧪 **Iniciando Teste Básico**\n\n' + '1️⃣ Testando conexão...',
    { quotedMsg: message.id }
  )

  // Test message sending
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await client.sendText(message.from, '✅ Envio de mensagens OK')

  // Test typing indicator
  await client.startTyping(message.from, 2000)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  await client.sendText(message.from, '✅ Indicador de digitação OK')

  // Test agent initialization
  const team = AgentTeam.getInstance()
  const agents = team.getAgents()
  await client.sendText(
    message.from,
    `✅ Sistema de agentes OK (${agents.length} agentes carregados)`
  )

  await client.sendText(
    message.from,
    '🎉 **Teste básico concluído com sucesso!**\n\n' + 'Todos os sistemas estão operacionais.'
  )
}

async function testAllAgents(client: Whatsapp, message: Message): Promise<void> {
  const team = AgentTeam.getInstance()
  const agents = team.getAgents()

  await client.sendText(
    message.from,
    `🤖 **Testando ${agents.length} Agentes**\n` + '─'.repeat(40),
    { quotedMsg: message.id }
  )

  for (const agent of agents) {
    await client.startTyping(message.from, 1000)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const testPrompt = getTestPromptForAgent(agent.id)
    const canHandle = await agent.canHandle(testPrompt, {
      messages: [message],
      topic: 'test',
      participants: ['tester'],
      mood: 'neutral',
      language: 'pt-BR',
      groupId: message.from,
    })

    await client.sendText(
      message.from,
      `${agent.personality.emoji} **${agent.name}** (${agent.id})\n` +
        `• Confiança: ${Math.round(canHandle * 100)}%\n` +
        `• Modelo: ${agent.modelConfig.model.split('/').pop()}\n` +
        `• Status: ✅ Operacional`
    )
  }
}

async function testReactions(client: Whatsapp, message: Message): Promise<void> {
  await client.sendText(
    message.from,
    '😊 **Testando Sistema de Reações**\n\n' + 'Vou adicionar algumas reações a esta mensagem...',
    { quotedMsg: message.id }
  )

  const reactions = ['🤔', '⚙️', '🔍', '✅', '🎉']

  for (const reaction of reactions) {
    try {
      // @ts-ignore
      await client.sendReactionToMessage(message.id, reaction)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      Logger.debug(`Could not add reaction ${reaction}: ${error}`)
    }
  }

  await client.sendText(message.from, 'Se você viu as reações, o sistema está funcionando! 🎊')
}

async function testTeamCollaboration(client: Whatsapp, message: Message): Promise<void> {
  await client.sendText(
    message.from,
    '👥 **Teste de Colaboração em Equipe**\n\n' +
      'Simulando uma tarefa complexa que requer múltiplos agentes...',
    { quotedMsg: message.id }
  )

  // Create a complex task message
  const complexTask = {
    ...message,
    body: 'Analise o código Python, calcule a complexidade e escreva documentação criativa',
  }

  const team = AgentTeam.getInstance()
  await team.processMessage(client, complexTask)
}

async function sendTestHelp(client: Whatsapp, message: Message): Promise<void> {
  const help = `🧪 **Comando de Teste - Opções Disponíveis**
━━━━━━━━━━━━━━━━━━━━━━━━

**!test basic**
Testa funcionalidades básicas do bot

**!test agents**
Testa todos os agentes individualmente

**!test reactions**
Testa o sistema de reações com emojis

**!test team**
Testa colaboração entre múltiplos agentes

━━━━━━━━━━━━━━━━━━━━━━━━
💡 Use estes testes para verificar se tudo está funcionando!`

  await client.sendText(message.from, help, { quotedMsg: message.id })
}

function getTestPromptForAgent(agentId: string): string {
  const prompts: Record<string, string> = {
    research: 'What is artificial intelligence?',
    code: 'Write a hello world in Python',
    math: 'Calculate 2 + 2',
    creative: 'Write a short poem',
    visual: 'Describe a sunset',
  }

  return prompts[agentId] || 'Can you help me?'
}
