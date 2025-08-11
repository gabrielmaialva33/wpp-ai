import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { MessageService } from '../services/MessageService.js'
import { ContactService } from '../services/ContactService.js'
import { Logger } from '../utils/logger.js'

export const dm: ICommand = {
  name: 'dm',
  description: 'Envia mensagem privada para um número',
  aliases: ['pv', 'private', 'msg'],
  usage: '!dm <numero> <mensagem>',
  category: 'Messages',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      if (args.length < 2) {
        await sendHelp(client, message)
        return
      }

      // Extract number and message
      const targetNumber = args[0]
      const textMessage = args.slice(1).join(' ')

      // Validate number format
      if (!isValidPhoneFormat(targetNumber)) {
        await client.sendText(
          message.from,
          '❌ Formato de número inválido!\n\n' +
            'Use um dos formatos:\n' +
            '• 11999999999 (nacional)\n' +
            '• +5511999999999 (internacional)\n' +
            '• 5511999999999',
          { quotedMsg: message.id }
        )
        return
      }

      // Send typing indicator
      await client.startTyping(message.from, 2000)

      // Get services
      const messageService = MessageService.getInstance()
      const contactService = ContactService.getInstance()

      // Format the number
      const formattedNumber = contactService.formatPhoneNumber(targetNumber)

      // Send status message
      await client.sendText(message.from, `📱 Verificando número ${formattedNumber}...`, {
        quotedMsg: message.id,
      })

      // Validate if number has WhatsApp
      const isValid = await contactService.checkNumberStatus(client, formattedNumber)

      if (!isValid) {
        await client.sendText(
          message.from,
          `❌ O número ${formattedNumber} não tem WhatsApp ou não existe.`,
          { quotedMsg: message.id }
        )
        return
      }

      // Send the private message
      const result = await messageService.sendPrivateMessage(
        client,
        message.sender.id || message.from,
        formattedNumber,
        textMessage
      )

      if (result.success) {
        await client.sendText(
          message.from,
          `✅ ${result.message}\n\n` +
            `📤 Mensagem: "${textMessage.substring(0, 50)}${textMessage.length > 50 ? '...' : ''}"`,
          { quotedMsg: message.id }
        )
      } else {
        await client.sendText(message.from, `❌ Erro ao enviar mensagem: ${result.error}`, {
          quotedMsg: message.id,
        })
      }
    } catch (error) {
      Logger.error(`DM command error: ${error}`)
      await client.sendText(message.from, '❌ Erro ao processar comando. Tente novamente.', {
        quotedMsg: message.id,
      })
    }
  },
}

async function sendHelp(client: Whatsapp, message: Message): Promise<void> {
  const help = `📱 **Comando DM - Mensagem Privada**
━━━━━━━━━━━━━━━━━━━━━━━━

**Uso:** !dm <numero> <mensagem>

**Exemplos:**
• !dm 11999999999 Olá, tudo bem?
• !dm +5511999999999 Mensagem teste
• !dm 5511999999999 Como você está?

**Recursos:**
• ✅ Validação automática do número
• 📊 Histórico de mensagens salvo
• 🔒 Verificação se é WhatsApp
• 📱 Suporte a números nacionais e internacionais

**Aliases:** !pv, !private, !msg

━━━━━━━━━━━━━━━━━━━━━━━━
💡 O número será formatado automaticamente!`

  await client.sendText(message.from, help, { quotedMsg: message.id })
}

function isValidPhoneFormat(phone: string): boolean {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Check if it's a valid phone number format
  // Minimum 8 digits, maximum 15 (international standard)
  const phoneRegex = /^\+?\d{8,15}$/

  return phoneRegex.test(cleaned)
}
