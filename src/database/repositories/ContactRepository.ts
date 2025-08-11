import { db } from '../client.js'
import { Logger } from '../../utils/logger.js'

export interface Contact {
  id?: number
  number: string
  name?: string
  is_whatsapp?: boolean
  is_blocked?: boolean
  verified_at?: Date
  created_at?: Date
  updated_at?: Date
}

export class ContactRepository {
  private static instance: ContactRepository

  static getInstance(): ContactRepository {
    if (!ContactRepository.instance) {
      ContactRepository.instance = new ContactRepository()
    }
    return ContactRepository.instance
  }

  async create(contact: Contact): Promise<Contact> {
    try {
      const stmt = db.prepare(`
        INSERT INTO contacts (number, name, is_whatsapp, is_blocked, verified_at)
        VALUES (?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        contact.number,
        contact.name || null,
        contact.is_whatsapp ? 1 : 0,
        contact.is_blocked ? 1 : 0,
        contact.verified_at || null
      )

      return {
        ...contact,
        id: result.lastInsertRowid as number,
      }
    } catch (error) {
      Logger.error(`Error creating contact: ${error}`)
      throw error
    }
  }

  async findByNumber(number: string): Promise<Contact | null> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM contacts WHERE number = ?
      `)

      const result = stmt.get(number) as any
      if (!result) return null

      return this.mapToContact(result)
    } catch (error) {
      Logger.error(`Error finding contact: ${error}`)
      throw error
    }
  }

  async findAll(): Promise<Contact[]> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM contacts ORDER BY name ASC
      `)

      const results = stmt.all() as any[]
      return results.map(this.mapToContact)
    } catch (error) {
      Logger.error(`Error fetching contacts: ${error}`)
      throw error
    }
  }

  async update(number: string, updates: Partial<Contact>): Promise<boolean> {
    try {
      const fields: string[] = []
      const values: any[] = []

      if (updates.name !== undefined) {
        fields.push('name = ?')
        values.push(updates.name)
      }
      if (updates.is_whatsapp !== undefined) {
        fields.push('is_whatsapp = ?')
        values.push(updates.is_whatsapp ? 1 : 0)
      }
      if (updates.is_blocked !== undefined) {
        fields.push('is_blocked = ?')
        values.push(updates.is_blocked ? 1 : 0)
      }
      if (updates.verified_at !== undefined) {
        fields.push('verified_at = ?')
        values.push(updates.verified_at)
      }

      if (fields.length === 0) return false

      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(number)

      const stmt = db.prepare(`
        UPDATE contacts SET ${fields.join(', ')} WHERE number = ?
      `)

      const result = stmt.run(...values)
      return result.changes > 0
    } catch (error) {
      Logger.error(`Error updating contact: ${error}`)
      throw error
    }
  }

  async delete(number: string): Promise<boolean> {
    try {
      const stmt = db.prepare(`
        DELETE FROM contacts WHERE number = ?
      `)

      const result = stmt.run(number)
      return result.changes > 0
    } catch (error) {
      Logger.error(`Error deleting contact: ${error}`)
      throw error
    }
  }

  async searchByName(query: string): Promise<Contact[]> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM contacts 
        WHERE name LIKE ? 
        ORDER BY name ASC
      `)

      const results = stmt.all(`%${query}%`) as any[]
      return results.map(this.mapToContact)
    } catch (error) {
      Logger.error(`Error searching contacts: ${error}`)
      throw error
    }
  }

  async getWhatsAppContacts(): Promise<Contact[]> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM contacts 
        WHERE is_whatsapp = 1 AND is_blocked = 0
        ORDER BY name ASC
      `)

      const results = stmt.all() as any[]
      return results.map(this.mapToContact)
    } catch (error) {
      Logger.error(`Error fetching WhatsApp contacts: ${error}`)
      throw error
    }
  }

  async blockContact(number: string): Promise<boolean> {
    return this.update(number, { is_blocked: true })
  }

  async unblockContact(number: string): Promise<boolean> {
    return this.update(number, { is_blocked: false })
  }

  private mapToContact(row: any): Contact {
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      is_whatsapp: row.is_whatsapp === 1,
      is_blocked: row.is_blocked === 1,
      verified_at: row.verified_at ? new Date(row.verified_at) : undefined,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    }
  }
}
