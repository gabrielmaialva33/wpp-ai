import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { ICommand } from '../core/interfaces/ICommand.js'
import { ContactService } from '../services/ContactService.js'
import { MessageService } from '../services/MessageService.js'
import { Logger } from '../utils/logger.js'

export const contact: ICommand = {
  name: 'contact',
  description: 'Gerencia e verifica contatos',
  aliases: ['contato', 'check', 'verify'],
  usage: '!contact <ação> [parametros]',
  category: 'Messages',

  async execute(client: Whatsapp, message: Message) {
    if (message.type !== MessageType.CHAT) return
    if (!message.body) return

    try {
      const args = message.body.slice(1).split(' ')
      args.shift() // Remove command name

      if (args.length === 0) {
        await sendHelp(client, message)
        return
      }

      const action = args[0].toLowerCase()
      const contactService = ContactService.getInstance()
      const messageService = MessageService.getInstance()

      switch (action) {
        case 'check':
        case 'verificar': {
          if (args.length < 2) {
            await client.sendText(message.from, '❌ Use: !contact check <numero>', {
              quotedMsg: message.id,
            })
            return
          }

          const number = args[1]
          const formattedNumber = contactService.formatPhoneNumber(number)

          await client.sendText(message.from, `🔍 Verificando ${formattedNumber}...`, {
            quotedMsg: message.id,
          })

          const isValid = await contactService.checkNumberStatus(client, formattedNumber)

          if (isValid) {
            // Save to database
            await contactService.validateAndSaveContact(client, formattedNumber)

            await client.sendText(
              message.from,
              `✅ **Número Válido**\n\n` +
                `📱 Número: ${formattedNumber}\n` +
                `💬 WhatsApp: Sim\n` +
                `📅 Verificado: ${new Date().toLocaleString('pt-BR')}`,
              { quotedMsg: message.id }
            )
          } else {
            await client.sendText(
              message.from,
              `❌ **Número Inválido**\n\n` + `📱 Número: ${formattedNumber}\n` + `💬 WhatsApp: Não`,
              { quotedMsg: message.id }
            )
          }
          break
        }

        case 'list':
        case 'listar': {
          const contacts = await contactService.getWhatsAppContacts()

          if (contacts.length === 0) {
            await client.sendText(message.from, '📱 Nenhum contato salvo ainda.', {
              quotedMsg: message.id,
            })
            return
          }

          const contactList = contacts
            .slice(0, 20) // Limit to 20 for message size
            .map((c) => `• ${c.name || 'Sem nome'} - ${c.number}`)
            .join('\n')

          await client.sendText(
            message.from,
            `📱 **Contatos Salvos** (${contacts.length} total)\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${contactList}\n\n` +
              `${contacts.length > 20 ? `... e mais ${contacts.length - 20} contatos` : ''}`,
            { quotedMsg: message.id }
          )
          break
        }

        case 'search':
        case 'buscar': {
          if (args.length < 2) {
            await client.sendText(message.from, '❌ Use: !contact search <nome>', {
              quotedMsg: message.id,
            })
            return
          }

          const query = args.slice(1).join(' ')
          const results = await contactService.searchContacts(query)

          if (results.length === 0) {
            await client.sendText(message.from, `🔍 Nenhum contato encontrado com "${query}"`, {
              quotedMsg: message.id,
            })
            return
          }

          const resultList = results
            .slice(0, 10)
            .map((c) => `• ${c.name} - ${c.number}`)
            .join('\n')

          await client.sendText(
            message.from,
            `🔍 **Resultados da Busca** (${results.length} encontrados)\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${resultList}`,
            { quotedMsg: message.id }
          )
          break
        }

        case 'stats':
        case 'estatisticas': {
          const number = args[1] ? contactService.formatPhoneNumber(args[1]) : undefined
          const stats = await messageService.getStatistics(number)

          await client.sendText(
            message.from,
            `📊 **Estatísticas de Mensagens**\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${number ? `📱 Número: ${number}\n\n` : ''}` +
              `📨 Total: ${stats.total}\n` +
              `✅ Enviadas: ${stats.sent}\n` +
              `📬 Entregues: ${stats.delivered}\n` +
              `👁️ Lidas: ${stats.read}\n` +
              `❌ Falhas: ${stats.failed}`,
            { quotedMsg: message.id }
          )
          break
        }

        case 'block':
        case 'bloquear': {
          if (args.length < 2) {
            await client.sendText(message.from, '❌ Use: !contact block <numero>', {
              quotedMsg: message.id,
            })
            return
          }

          const number = args[1]
          const success = await contactService.blockContact(number)

          if (success) {
            await client.sendText(message.from, `🚫 Contato ${number} bloqueado com sucesso!`, {
              quotedMsg: message.id,
            })
          } else {
            await client.sendText(message.from, `❌ Erro ao bloquear contato ${number}`, {
              quotedMsg: message.id,
            })
          }
          break
        }

        case 'unblock':
        case 'desbloquear': {
          if (args.length < 2) {
            await client.sendText(message.from, '❌ Use: !contact unblock <numero>', {
              quotedMsg: message.id,
            })
            return
          }

          const number = args[1]
          const success = await contactService.unblockContact(number)

          if (success) {
            await client.sendText(message.from, `✅ Contato ${number} desbloqueado com sucesso!`, {
              quotedMsg: message.id,
            })
          } else {
            await client.sendText(message.from, `❌ Erro ao desbloquear contato ${number}`, {
              quotedMsg: message.id,
            })
          }
          break
        }

        default:
          await sendHelp(client, message)
      }
    } catch (error) {
      Logger.error(`Contact command error: ${error}`)
      await client.sendText(message.from, '❌ Erro ao processar comando. Tente novamente.', {
        quotedMsg: message.id,
      })
    }
  },
}

async function sendHelp(client: Whatsapp, message: Message): Promise<void> {
  const help = `📱 **Comando Contact - Gerenciamento de Contatos**
━━━━━━━━━━━━━━━━━━━━━━━━

**Ações disponíveis:**

**!contact check <numero>**
Verifica se um número tem WhatsApp

**!contact list**
Lista todos os contatos salvos

**!contact search <nome>**
Busca contatos por nome

**!contact stats [numero]**
Mostra estatísticas de mensagens

**!contact block <numero>**
Bloqueia um contato

**!contact unblock <numero>**
Desbloqueia um contato

**Exemplos:**
• !contact check 11999999999
• !contact search João
• !contact stats
• !contact block 11999999999

**Aliases:** !contato, !check, !verify

━━━━━━━━━━━━━━━━━━━━━━━━
💡 Todos os contatos verificados são salvos automaticamente!`

  await client.sendText(message.from, help, { quotedMsg: message.id })
}
