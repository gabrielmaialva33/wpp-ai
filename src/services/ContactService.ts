import { Whatsapp } from '@wppconnect-team/wppconnect'
import { ContactRepository, Contact } from '../database/repositories/ContactRepository.js'
import { Logger } from '../utils/logger.js'

export class ContactService {
  private static instance: ContactService
  private contactRepo: ContactRepository

  private constructor() {
    this.contactRepo = ContactRepository.getInstance()
  }

  static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService()
    }
    return ContactService.instance
  }

  /**
   * Validate and save a WhatsApp contact
   */
  async validateAndSaveContact(
    client: Whatsapp,
    number: string,
    name?: string
  ): Promise<Contact | null> {
    try {
      // Format number
      const formattedNumber = this.formatPhoneNumber(number)

      // Check if contact already exists
      let contact = await this.contactRepo.findByNumber(formattedNumber)

      if (contact && contact.is_whatsapp && contact.verified_at) {
        // If recently verified (within 24 hours), skip re-verification
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (contact.verified_at > dayAgo) {
          return contact
        }
      }

      // Verify if number has WhatsApp
      const isValid = await this.checkNumberStatus(client, formattedNumber)

      if (!isValid) {
        Logger.warn(`Number ${formattedNumber} is not a valid WhatsApp number`)
        return null
      }

      // Create or update contact
      if (contact) {
        await this.contactRepo.update(formattedNumber, {
          is_whatsapp: true,
          verified_at: new Date(),
          name: name || contact.name,
        })
        contact.is_whatsapp = true
        contact.verified_at = new Date()
      } else {
        contact = await this.contactRepo.create({
          number: formattedNumber,
          name: name || undefined,
          is_whatsapp: true,
          verified_at: new Date(),
        })
      }

      Logger.info(`Contact validated and saved: ${formattedNumber}`)
      return contact
    } catch (error) {
      Logger.error(`Error validating contact: ${error}`)
      return null
    }
  }

  /**
   * Check if a number has WhatsApp
   */
  async checkNumberStatus(client: Whatsapp, number: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(number)
      const contactId = `${formattedNumber}@c.us`

      // @ts-ignore
      const result = await client.checkNumberStatus(contactId)

      if (result && result.numberExists) {
        return true
      }

      return false
    } catch (error) {
      Logger.error(`Error checking number status: ${error}`)

      // Try alternative method
      try {
        // @ts-ignore
        const profile = await client.getNumberProfile(contactId)
        return !!profile
      } catch {
        return false
      }
    }
  }

  /**
   * Format phone number to WhatsApp format
   */
  formatPhoneNumber(number: string): string {
    // Remove all non-numeric characters
    let cleaned = number.replace(/\D/g, '')

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '')

    // Brazilian number formatting
    if (cleaned.length === 10 || cleaned.length === 11) {
      // Local Brazilian number, add country code
      if (!cleaned.startsWith('55')) {
        cleaned = '55' + cleaned
      }
    }

    // Ensure it starts with country code
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      // Valid Brazilian number with country code
      return cleaned
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      // Brazilian number with 9th digit
      return cleaned
    }

    // Return as is for international numbers
    return cleaned
  }

  /**
   * Get all WhatsApp contacts
   */
  async getWhatsAppContacts(): Promise<Contact[]> {
    return this.contactRepo.getWhatsAppContacts()
  }

  /**
   * Search contacts by name
   */
  async searchContacts(query: string): Promise<Contact[]> {
    return this.contactRepo.searchByName(query)
  }

  /**
   * Block a contact
   */
  async blockContact(number: string): Promise<boolean> {
    const formattedNumber = this.formatPhoneNumber(number)
    return this.contactRepo.blockContact(formattedNumber)
  }

  /**
   * Unblock a contact
   */
  async unblockContact(number: string): Promise<boolean> {
    const formattedNumber = this.formatPhoneNumber(number)
    return this.contactRepo.unblockContact(formattedNumber)
  }

  /**
   * Get contact by number
   */
  async getContact(number: string): Promise<Contact | null> {
    const formattedNumber = this.formatPhoneNumber(number)
    return this.contactRepo.findByNumber(formattedNumber)
  }

  /**
   * Parse numbers from text (for broadcast lists)
   */
  parseNumbersFromText(text: string): string[] {
    // Match phone numbers in various formats
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
    const matches = text.match(phoneRegex) || []

    return matches.map((num) => this.formatPhoneNumber(num)).filter((num) => num.length >= 10) // Filter out invalid numbers
  }

  /**
   * Validate multiple numbers
   */
  async validateMultipleNumbers(
    client: Whatsapp,
    numbers: string[]
  ): Promise<{ valid: string[]; invalid: string[] }> {
    const valid: string[] = []
    const invalid: string[] = []

    for (const number of numbers) {
      const formattedNumber = this.formatPhoneNumber(number)
      const isValid = await this.checkNumberStatus(client, formattedNumber)

      if (isValid) {
        valid.push(formattedNumber)
      } else {
        invalid.push(formattedNumber)
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return { valid, invalid }
  }
}
