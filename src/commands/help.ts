import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { getAllCommands } from '../bot.js'

export const help: ICommand = {
  name: 'help',
  description: 'Mostra todos os comandos disponíveis',
  aliases: ['ajuda', 'h', 'comandos'],
  usage: '!help [comando]',
  category: 'Utility',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      // Check if user wants help for specific command
      if (args.length > 0) {
        await sendCommandHelp(client, message, args[0])
        return
      }

      // Send general help
      await sendGeneralHelp(client, message)
    } catch (error) {
      await client.sendText(message.from, '❌ Erro ao exibir ajuda. Tente novamente.', {
        quotedMsg: message.id,
      })
    }
  },
}

async function sendGeneralHelp(client: Whatsapp, message: Message): Promise<void> {
  // We could use getAllCommands() here to dynamically list commands
  // const commands = getAllCommands()

  const helpMessage = `🤖 **WhatsApp AI Bot - Central de Ajuda**
━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **Prefixos disponíveis:** ! / .

📚 **CATEGORIAS DE COMANDOS**

🤖 **INTELIGÊNCIA ARTIFICIAL**
────────────────────────
• \`!ai [provider] <pergunta>\`
  Chat com diferentes IAs (gemini, nvidia)
  _Ex: !ai gemini O que é IA?_

• \`!compare <pergunta>\`
  Compara respostas de múltiplas IAs
  _Ex: !compare Explique computação quântica_

• \`!image <descrição>\`
  Gera imagens usando IA
  _Ex: !image um gato astronauta_

• \`!team <tarefa>\`
  Ativa equipe completa de agentes
  _Ex: !team analise o mercado de crypto_

• \`!agent <nome> <mensagem>\`
  Fala com agente específico
  _Ex: !agent code crie uma função Python_

📨 **MENSAGENS PRIVADAS**
────────────────────────
• \`!dm <numero> <mensagem>\`
  Envia mensagem privada
  _Ex: !dm 11999999999 Olá!_

• \`!broadcast <numeros> | <msg>\`
  Envia para múltiplos contatos
  _Ex: !broadcast 11999999999, 11888888888 | Novidade!_

📱 **GERENCIAMENTO DE CONTATOS**
────────────────────────
• \`!contact check <numero>\`
  Verifica se número tem WhatsApp

• \`!contact list\`
  Lista contatos salvos

• \`!contact search <nome>\`
  Busca contatos por nome

• \`!contact stats [numero]\`
  Estatísticas de mensagens

• \`!contact block/unblock <numero>\`
  Bloqueia/desbloqueia contatos

📊 **ANÁLISE & GRUPO**
────────────────────────
• \`!vibe\`
  Analisa o clima e humor do grupo
  _Mostra sentimentos e tópicos em alta_

🎮 **UTILIDADES**
────────────────────────
• \`!help [comando]\`
  Mostra esta ajuda ou detalhes de um comando
  _Ex: !help dm_

• \`!ping\`
  Verifica se o bot está online

• \`!info\`
  Informações sobre o bot

• \`!test\`
  Testa funcionalidades básicas

━━━━━━━━━━━━━━━━━━━━━━━━

💡 **DICAS:**
• Use \`!help <comando>\` para ver detalhes
• Todos os comandos funcionam com ! / .
• Mensagens privadas são salvas no banco
• IAs têm limite de requisições por minuto

📖 **AGENTES ESPECIALIZADOS:**
• \`research\` - Pesquisa e informações
• \`code\` - Programação e debug
• \`math\` - Matemática e cálculos
• \`creative\` - Escrita criativa
• \`visual\` - Geração de imagens

━━━━━━━━━━━━━━━━━━━━━━━━
🚀 **Bot desenvolvido com ❤️**
_Digite !help <comando> para mais detalhes_`

  await client.sendText(message.from, helpMessage, { quotedMsg: message.id })
}

async function sendCommandHelp(
  client: Whatsapp,
  message: Message,
  commandName: string
): Promise<void> {
  const commands = getAllCommands()

  // Find command by name or alias
  const command = commands.find(
    (cmd) =>
      cmd.name === commandName.toLowerCase() ||
      (cmd.aliases && cmd.aliases.includes(commandName.toLowerCase()))
  )

  if (!command) {
    await client.sendText(
      message.from,
      `❌ Comando "${commandName}" não encontrado.\n\nUse \`!help\` para ver todos os comandos.`,
      { quotedMsg: message.id }
    )
    return
  }

  // Build detailed help for specific command
  let detailedHelp = `📖 **Ajuda para: ${command.name}**\n`
  detailedHelp += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

  detailedHelp += `📝 **Descrição:**\n${command.description}\n\n`

  if (command.usage) {
    detailedHelp += `💡 **Como usar:**\n\`${command.usage}\`\n\n`
  }

  if (command.aliases && command.aliases.length > 0) {
    detailedHelp += `🔄 **Aliases (outros nomes):**\n`
    detailedHelp += command.aliases.map((a) => `\`!${a}\``).join(', ') + '\n\n'
  }

  if (command.category) {
    detailedHelp += `📂 **Categoria:** ${command.category}\n\n`
  }

  // Add specific examples based on command
  detailedHelp += getCommandExamples(command.name)

  detailedHelp += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
  detailedHelp += `💡 Use \`!help\` para ver todos os comandos`

  await client.sendText(message.from, detailedHelp, { quotedMsg: message.id })
}

function getCommandExamples(commandName: string): string {
  const examples: Record<string, string> = {
    ai: `📌 **Exemplos de uso:**

• \`!ai Qual é a capital do Brasil?\`
  Usa o provider padrão (Gemini)

• \`!ai nvidia Explique física quântica\`
  Usa especificamente o NVIDIA

• \`!ai gemini Escreva um poema\`
  Usa especificamente o Gemini

⚠️ **Limites:** 10 requisições por minuto\n\n`,

    dm: `📌 **Exemplos de uso:**

• \`!dm 11999999999 Olá, tudo bem?\`
  Envia para número nacional

• \`!dm +5511999999999 Reunião às 15h\`
  Envia para número internacional

• \`!dm 5511999999999 Confirmado!\`
  Formato alternativo

✅ O número é verificado automaticamente
📊 Mensagens são salvas no histórico\n\n`,

    broadcast: `📌 **Exemplos de uso:**

• \`!broadcast 11999999999, 11888888888 | Promoção!\`
  Envia para múltiplos números

• \`!broadcast 11999999999 11888888888 | Aviso importante\`
  Números separados por espaço

⚠️ **Limites:** Máximo 20 números por vez
⏱️ Delay de 1.5s entre mensagens (anti-spam)\n\n`,

    contact: `📌 **Exemplos de uso:**

• \`!contact check 11999999999\`
  Verifica se tem WhatsApp

• \`!contact list\`
  Lista todos os contatos

• \`!contact search João\`
  Busca por nome

• \`!contact stats\`
  Estatísticas gerais

• \`!contact block 11999999999\`
  Bloqueia contato\n\n`,

    team: `📌 **Exemplos de uso:**

• \`!team analise o mercado de criptomoedas\`
  Análise completa com múltiplos agentes

• \`!team status\`
  Mostra agentes disponíveis

• \`!team list\`
  Lista detalhada dos agentes

🤖 A equipe coordena automaticamente
   os melhores agentes para cada tarefa\n\n`,

    agent: `📌 **Exemplos de uso:**

• \`!agent research informações sobre IA\`
  Agente de pesquisa

• \`!agent code função para ordenar lista\`
  Agente de programação

• \`!agent math resolva x² + 5x + 6 = 0\`
  Agente matemático

• \`!agent creative escreva uma história\`
  Agente criativo

• \`!agent visual desenhe um robô\`
  Agente visual (imagens)\n\n`,

    image: `📌 **Exemplos de uso:**

• \`!image um gato astronauta no espaço\`
  Gera imagem com descrição

• \`!image nvidia robô futurista\`
  Usa provider específico

• \`!img paisagem cyberpunk\`
  Usando alias do comando

🎨 Imagens em 1024x1024px
⏱️ Pode levar alguns segundos\n\n`,

    compare: `📌 **Exemplos de uso:**

• \`!compare O que é inteligência artificial?\`
  Compara respostas de todas as IAs

• \`!cmp Explique computação quântica\`
  Usando alias do comando

📊 Mostra respostas lado a lado
🤖 Útil para comparar qualidade\n\n`,

    vibe: `📌 **Exemplos de uso:**

• \`!vibe\`
  Analisa as últimas 50 mensagens

📊 Mostra:
• Sentimento geral do grupo
• Membros mais ativos
• Tópicos em alta
• Humor predominante\n\n`,
  }

  return examples[commandName] || '📌 Use o comando para descobrir mais!\n\n'
}
