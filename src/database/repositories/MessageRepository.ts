import { db } from '../client.js'
import { Logger } from '../../utils/logger.js'

export interface PrivateMessage {
  id?: number
  from_number: string
  to_number: string
  message: string
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  message_id?: string
  created_at?: Date
  sent_at?: Date
  delivered_at?: Date
  read_at?: Date
  error_message?: string
}

export class MessageRepository {
  private static instance: MessageRepository

  static getInstance(): MessageRepository {
    if (!MessageRepository.instance) {
      MessageRepository.instance = new MessageRepository()
    }
    return MessageRepository.instance
  }

  async create(message: PrivateMessage): Promise<PrivateMessage> {
    try {
      const stmt = db.prepare(`
        INSERT INTO private_messages 
        (from_number, to_number, message, status, message_id)
        VALUES (?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        message.from_number,
        message.to_number,
        message.message,
        message.status || 'pending',
        message.message_id || null
      )

      return {
        ...message,
        id: result.lastInsertRowid as number,
        created_at: new Date(),
      }
    } catch (error) {
      Logger.error(`Error creating message: ${error}`)
      throw error
    }
  }

  async findById(id: number): Promise<PrivateMessage | null> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM private_messages WHERE id = ?
      `)

      const result = stmt.get(id) as any
      if (!result) return null

      return this.mapToMessage(result)
    } catch (error) {
      Logger.error(`Error finding message: ${error}`)
      throw error
    }
  }

  async findByMessageId(messageId: string): Promise<PrivateMessage | null> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM private_messages WHERE message_id = ?
      `)

      const result = stmt.get(messageId) as any
      if (!result) return null

      return this.mapToMessage(result)
    } catch (error) {
      Logger.error(`Error finding message by ID: ${error}`)
      throw error
    }
  }

  async getConversation(number1: string, number2: string, limit = 50): Promise<PrivateMessage[]> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM private_messages 
        WHERE (from_number = ? AND to_number = ?) 
           OR (from_number = ? AND to_number = ?)
        ORDER BY created_at DESC
        LIMIT ?
      `)

      const results = stmt.all(number1, number2, number2, number1, limit) as any[]
      return results.map(this.mapToMessage).reverse()
    } catch (error) {
      Logger.error(`Error fetching conversation: ${error}`)
      throw error
    }
  }

  async getRecentMessages(number: string, limit = 20): Promise<PrivateMessage[]> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM private_messages 
        WHERE from_number = ? OR to_number = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)

      const results = stmt.all(number, number, limit) as any[]
      return results.map(this.mapToMessage)
    } catch (error) {
      Logger.error(`Error fetching recent messages: ${error}`)
      throw error
    }
  }

  async updateStatus(
    id: number,
    status: PrivateMessage['status'],
    errorMessage?: string
  ): Promise<boolean> {
    try {
      let updateFields = 'status = ?'
      const values: any[] = [status]

      if (status === 'sent') {
        updateFields += ', sent_at = CURRENT_TIMESTAMP'
      } else if (status === 'delivered') {
        updateFields += ', delivered_at = CURRENT_TIMESTAMP'
      } else if (status === 'read') {
        updateFields += ', read_at = CURRENT_TIMESTAMP'
      } else if (status === 'failed' && errorMessage) {
        updateFields += ', error_message = ?'
        values.push(errorMessage)
      }

      values.push(id)

      const stmt = db.prepare(`
        UPDATE private_messages SET ${updateFields} WHERE id = ?
      `)

      const result = stmt.run(...values)
      return result.changes > 0
    } catch (error) {
      Logger.error(`Error updating message status: ${error}`)
      throw error
    }
  }

  async getPendingMessages(): Promise<PrivateMessage[]> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM private_messages 
        WHERE status = 'pending'
        ORDER BY created_at ASC
      `)

      const results = stmt.all() as any[]
      return results.map(this.mapToMessage)
    } catch (error) {
      Logger.error(`Error fetching pending messages: ${error}`)
      throw error
    }
  }

  async getStatistics(number?: string): Promise<{
    total: number
    sent: number
    delivered: number
    read: number
    failed: number
  }> {
    try {
      let whereClause = ''
      const values: any[] = []

      if (number) {
        whereClause = 'WHERE from_number = ? OR to_number = ?'
        values.push(number, number)
      }

      const stmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM private_messages ${whereClause}
      `)

      const result = stmt.get(...values) as any
      return {
        total: result.total || 0,
        sent: result.sent || 0,
        delivered: result.delivered || 0,
        read: result.read || 0,
        failed: result.failed || 0,
      }
    } catch (error) {
      Logger.error(`Error getting statistics: ${error}`)
      throw error
    }
  }

  private mapToMessage(row: any): PrivateMessage {
    return {
      id: row.id,
      from_number: row.from_number,
      to_number: row.to_number,
      message: row.message,
      status: row.status,
      message_id: row.message_id,
      created_at: row.created_at ? new Date(row.created_at) : undefined,
      sent_at: row.sent_at ? new Date(row.sent_at) : undefined,
      delivered_at: row.delivered_at ? new Date(row.delivered_at) : undefined,
      read_at: row.read_at ? new Date(row.read_at) : undefined,
      error_message: row.error_message,
    }
  }
}
