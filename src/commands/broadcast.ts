import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { MessageService } from '../services/MessageService.js'
import { ContactService } from '../services/ContactService.js'
import { Logger } from '../utils/logger.js'

export const broadcast: ICommand = {
  name: 'broadcast',
  description: 'Envia mensagem para múltiplos contatos',
  aliases: ['bc', 'mass', 'bulk'],
  usage: '!broadcast <numeros> | <mensagem>',
  category: 'Messages',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      const fullText = args.join(' ')

      // Split by pipe to separate numbers from message
      const parts = fullText.split('|')

      if (parts.length !== 2) {
        await sendHelp(client, message)
        return
      }

      const numbersText = parts[0].trim()
      const broadcastMessage = parts[1].trim()

      if (!numbersText || !broadcastMessage) {
        await sendHelp(client, message)
        return
      }

      // Parse numbers from text
      const contactService = ContactService.getInstance()
      const numbers = contactService.parseNumbersFromText(numbersText)

      if (numbers.length === 0) {
        await client.sendText(
          message.from,
          '❌ Nenhum número válido encontrado!\n\n' +
            'Certifique-se de usar números no formato:\n' +
            '• 11999999999\n' +
            '• Separados por vírgula ou espaço',
          { quotedMsg: message.id }
        )
        return
      }

      if (numbers.length > 20) {
        await client.sendText(
          message.from,
          '⚠️ Limite de 20 números por broadcast para evitar spam.\n' +
            'Divida em múltiplos broadcasts se necessário.',
          { quotedMsg: message.id }
        )
        return
      }

      // Send initial status
      await client.sendText(
        message.from,
        `📡 **Iniciando Broadcast**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📱 Destinatários: ${numbers.length}\n` +
          `📝 Mensagem: "${broadcastMessage.substring(0, 50)}${broadcastMessage.length > 50 ? '...' : ''}"\n\n` +
          `⏳ Processando...`,
        { quotedMsg: message.id }
      )

      // Start broadcast
      const messageService = MessageService.getInstance()
      const result = await messageService.sendBroadcast(
        client,
        message.sender.id || message.from,
        numbers,
        broadcastMessage,
        1500 // 1.5 second delay between messages
      )

      // Prepare detailed report
      const successList = result.results
        .filter((r) => r.success)
        .map((r) => `✅ ${r.number}`)
        .join('\n')

      const failedList = result.results
        .filter((r) => !r.success)
        .map((r) => `❌ ${r.number} - ${r.error}`)
        .join('\n')

      // Send final report
      const report = `📡 **Relatório do Broadcast**
━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Estatísticas:**
• Total: ${result.total}
• ✅ Enviados: ${result.sent}
• ❌ Falhas: ${result.failed}

${successList ? `**Sucesso:**\n${successList}\n` : ''}
${failedList ? `\n**Falhas:**\n${failedList}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
✅ Broadcast concluído!`

      await client.sendText(message.from, report, { quotedMsg: message.id })
    } catch (error) {
      Logger.error(`Broadcast command error: ${error}`)
      await client.sendText(message.from, '❌ Erro ao processar broadcast. Tente novamente.', {
        quotedMsg: message.id,
      })
    }
  },
}

async function sendHelp(client: Whatsapp, message: Message): Promise<void> {
  const help = `📡 **Comando Broadcast - Envio em Massa**
━━━━━━━━━━━━━━━━━━━━━━━━

**Uso:** !broadcast <numeros> | <mensagem>

**Exemplos:**
• !broadcast 11999999999, 11888888888 | Olá! Esta é uma mensagem em massa
• !broadcast 11999999999 11888888888 | Novidades disponíveis!
• !broadcast +5511999999999 5511888888888 | Promoção especial

**Formato dos números:**
• Separe por vírgula, espaço ou linha
• Máximo 20 números por vez
• Números inválidos serão ignorados

**Recursos:**
• ✅ Validação automática de números
• ⏱️ Delay entre mensagens (anti-spam)
• 📊 Relatório detalhado de envio
• 🔒 Verificação WhatsApp

**Aliases:** !bc, !mass, !bulk

━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Use com responsabilidade! Evite spam.`

  await client.sendText(message.from, help, { quotedMsg: message.id })
}
