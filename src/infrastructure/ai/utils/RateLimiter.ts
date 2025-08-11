import { Logger } from '../../../utils/logger.js'

interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour?: number
  requestsPerDay?: number
}

interface UserUsage {
  minute: { count: number; resetAt: Date }
  hour: { count: number; resetAt: Date }
  day: { count: number; resetAt: Date }
}

export class RateLimiter {
  private static instance: RateLimiter
  private userUsage = new Map<string, UserUsage>()

  private providerLimits: Record<string, RateLimitConfig> = {
    'gemini-2.5-pro': { requestsPerMinute: 2, requestsPerHour: 60 },
    'gemini-2.5-flash': { requestsPerMinute: 15, requestsPerHour: 1000 },
    'gemini': { requestsPerMinute: 15, requestsPerHour: 1000 },
    'nvidia': { requestsPerMinute: 10, requestsPerHour: 300 },
  }

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  async checkLimit(userId: string, provider: string): Promise<boolean> {
    const limits = this.providerLimits[provider] || {
      requestsPerMinute: 10,
      requestsPerHour: 100,
    }

    const userKey = `${userId}:${provider}`
    let usage = this.userUsage.get(userKey)

    const now = new Date()

    if (!usage) {
      usage = this.initializeUsage(now)
      this.userUsage.set(userKey, usage)
    }

    // Reset counters if time windows have passed
    if (now > usage.minute.resetAt) {
      usage.minute = {
        count: 0,
        resetAt: new Date(now.getTime() + 60000), // 1 minute
      }
    }

    if (now > usage.hour.resetAt) {
      usage.hour = {
        count: 0,
        resetAt: new Date(now.getTime() + 3600000), // 1 hour
      }
    }

    if (now > usage.day.resetAt) {
      usage.day = {
        count: 0,
        resetAt: new Date(now.getTime() + 86400000), // 24 hours
      }
    }

    // Check limits
    if (usage.minute.count >= limits.requestsPerMinute) {
      const waitTime = Math.ceil((usage.minute.resetAt.getTime() - now.getTime()) / 1000)
      Logger.warn(`Rate limit exceeded for ${userKey} - Wait ${waitTime}s`)
      return false
    }

    if (limits.requestsPerHour && usage.hour.count >= limits.requestsPerHour) {
      const waitTime = Math.ceil((usage.hour.resetAt.getTime() - now.getTime()) / 60000)
      Logger.warn(`Hourly rate limit exceeded for ${userKey} - Wait ${waitTime}m`)
      return false
    }

    if (limits.requestsPerDay && usage.day.count >= limits.requestsPerDay) {
      const waitTime = Math.ceil((usage.day.resetAt.getTime() - now.getTime()) / 3600000)
      Logger.warn(`Daily rate limit exceeded for ${userKey} - Wait ${waitTime}h`)
      return false
    }

    // Increment counters
    usage.minute.count++
    usage.hour.count++
    usage.day.count++

    return true
  }

  private initializeUsage(now: Date): UserUsage {
    return {
      minute: {
        count: 0,
        resetAt: new Date(now.getTime() + 60000),
      },
      hour: {
        count: 0,
        resetAt: new Date(now.getTime() + 3600000),
      },
      day: {
        count: 0,
        resetAt: new Date(now.getTime() + 86400000),
      },
    }
  }

  getRemainingRequests(
    userId: string,
    provider: string
  ): {
    minute: number
    hour: number
    day: number
  } {
    const limits = this.providerLimits[provider] || {
      requestsPerMinute: 10,
      requestsPerHour: 100,
    }

    const userKey = `${userId}:${provider}`
    const usage = this.userUsage.get(userKey)

    if (!usage) {
      return {
        minute: limits.requestsPerMinute,
        hour: limits.requestsPerHour || 100,
        day: limits.requestsPerDay || 1000,
      }
    }

    const now = new Date()

    return {
      minute:
        now > usage.minute.resetAt
          ? limits.requestsPerMinute
          : Math.max(0, limits.requestsPerMinute - usage.minute.count),
      hour:
        now > usage.hour.resetAt
          ? limits.requestsPerHour || 100
          : Math.max(0, (limits.requestsPerHour || 100) - usage.hour.count),
      day:
        now > usage.day.resetAt
          ? limits.requestsPerDay || 1000
          : Math.max(0, (limits.requestsPerDay || 1000) - usage.day.count),
    }
  }

  async waitForLimit(userId: string, provider: string): Promise<void> {
    while (!(await this.checkLimit(userId, provider))) {
      // Wait 1 second before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
