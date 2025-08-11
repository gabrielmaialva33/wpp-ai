import { Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageRepository, PrivateMessage } from '../database/repositories/MessageRepository.js'
import { ContactService } from './ContactService.js'
import { Logger } from '../utils/logger.js'

export class MessageService {
  private static instance: MessageService
  private messageRepo: MessageRepository
  private contactService: ContactService

  private constructor() {
    this.messageRepo = MessageRepository.getInstance()
    this.contactService = ContactService.getInstance()
  }

  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService()
    }
    return MessageService.instance
  }

  /**
   * Send a private message to a contact
   */
  async sendPrivateMessage(
    client: Whatsapp,
    fromNumber: string,
    toNumber: string,
    message: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Validate and save contact
      const contact = await this.contactService.validateAndSaveContact(client, toNumber)

      if (!contact) {
        return {
          success: false,
          error: 'Número não é um WhatsApp válido ou está bloqueado',
        }
      }

      if (contact.is_blocked) {
        return {
          success: false,
          error: 'Este contato está bloqueado',
        }
      }

      // Format the contact ID for WhatsApp
      const contactId = `${contact.number}@c.us`

      // Save message to database
      const dbMessage = await this.messageRepo.create({
        from_number: fromNumber,
        to_number: contact.number,
        message: message,
        status: 'pending',
      })

      try {
        // Send the message
        const result = await client.sendText(contactId, message)

        // Update message status
        if (result && result.id) {
          await this.messageRepo.updateStatus(dbMessage.id!, 'sent')

          Logger.info(`Message sent successfully to ${contact.number}`)

          return {
            success: true,
            message: `Mensagem enviada para ${contact.name || contact.number}`,
          }
        } else {
          throw new Error('Failed to send message')
        }
      } catch (sendError) {
        // Update message status to failed
        await this.messageRepo.updateStatus(dbMessage.id!, 'failed', String(sendError))

        throw sendError
      }
    } catch (error) {
      Logger.error(`Error sending private message: ${error}`)
      return {
        success: false,
        error: `Erro ao enviar mensagem: ${error}`,
      }
    }
  }

  /**
   * Send broadcast message to multiple contacts
   */
  async sendBroadcast(
    client: Whatsapp,
    fromNumber: string,
    numbers: string[],
    message: string,
    delayMs = 1000
  ): Promise<{
    total: number
    sent: number
    failed: number
    results: Array<{ number: string; success: boolean; error?: string }>
  }> {
    const results: Array<{ number: string; success: boolean; error?: string }> = []
    let sent = 0
    let failed = 0

    // Validate all numbers first
    const validation = await this.contactService.validateMultipleNumbers(client, numbers)

    // Send to valid numbers
    for (const number of validation.valid) {
      try {
        const result = await this.sendPrivateMessage(client, fromNumber, number, message)

        if (result.success) {
          sent++
          results.push({ number, success: true })
        } else {
          failed++
          results.push({ number, success: false, error: result.error })
        }

        // Delay between messages to avoid rate limiting
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      } catch (error) {
        failed++
        results.push({ number, success: false, error: String(error) })
      }
    }

    // Add invalid numbers to results
    for (const number of validation.invalid) {
      failed++
      results.push({ number, success: false, error: 'Número inválido' })
    }

    Logger.info(`Broadcast completed: ${sent} sent, ${failed} failed out of ${numbers.length}`)

    return {
      total: numbers.length,
      sent,
      failed,
      results,
    }
  }

  /**
   * Get conversation history between two numbers
   */
  async getConversation(number1: string, number2: string, limit = 50): Promise<PrivateMessage[]> {
    const formatted1 = this.contactService.formatPhoneNumber(number1)
    const formatted2 = this.contactService.formatPhoneNumber(number2)

    return this.messageRepo.getConversation(formatted1, formatted2, limit)
  }

  /**
   * Get recent messages for a number
   */
  async getRecentMessages(number: string, limit = 20): Promise<PrivateMessage[]> {
    const formattedNumber = this.contactService.formatPhoneNumber(number)
    return this.messageRepo.getRecentMessages(formattedNumber, limit)
  }

  /**
   * Get message statistics
   */
  async getStatistics(number?: string): Promise<{
    total: number
    sent: number
    delivered: number
    read: number
    failed: number
  }> {
    if (number) {
      const formattedNumber = this.contactService.formatPhoneNumber(number)
      return this.messageRepo.getStatistics(formattedNumber)
    }
    return this.messageRepo.getStatistics()
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(client: Whatsapp): Promise<{
    retried: number
    succeeded: number
    failed: number
  }> {
    const pendingMessages = await this.messageRepo.getPendingMessages()
    let retried = 0
    let succeeded = 0
    let failed = 0

    for (const msg of pendingMessages) {
      retried++

      try {
        const result = await this.sendPrivateMessage(
          client,
          msg.from_number,
          msg.to_number,
          msg.message
        )

        if (result.success) {
          succeeded++
        } else {
          failed++
        }
      } catch (error) {
        failed++
        Logger.error(`Error retrying message ${msg.id}: ${error}`)
      }

      // Small delay between retries
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    Logger.info(`Retry completed: ${succeeded} succeeded, ${failed} failed out of ${retried}`)

    return { retried, succeeded, failed }
  }

  /**
   * Format message with template variables
   */
  formatMessageWithVariables(template: string, variables: Record<string, string>): string {
    let message = template

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      message = message.replace(regex, value)
    }

    // Add current date/time variables
    const now = new Date()
    message = message.replace(/{{date}}/g, now.toLocaleDateString('pt-BR'))
    message = message.replace(/{{time}}/g, now.toLocaleTimeString('pt-BR'))
    message = message.replace(/{{datetime}}/g, now.toLocaleString('pt-BR'))

    return message
  }
}
