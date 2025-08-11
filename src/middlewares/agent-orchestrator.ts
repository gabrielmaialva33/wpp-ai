import { Message, Whatsapp } from '@wppconnect-team/wppconnect'
import { MessageType } from '@wppconnect-team/wppconnect/dist/api/model/enum/index.js'
import { AgentTeam } from '../agents/team/AgentTeam.js'
import { NAMES, PREFIXES } from '../env.js'
import { StringUtils } from '../utils/index.js'
import { Logger } from '../utils/logger.js'

export const execute = async (client: Whatsapp, message: Message) => {
  if (message.type !== MessageType.CHAT) return
  if (!message.body) return

  try {
    const team = AgentTeam.getInstance()
    // const messageBody = message.body.toLowerCase()

    // Check for direct agent commands
    if (StringUtils.isCommand(PREFIXES, message.body)) {
      return // Let command handler process it
    }

    // Check if bot is mentioned for agent interaction
    if (StringUtils.includes(message.body, NAMES)) {
      // Extract agent name if specified
      const agentPattern = /@\w+\s+(research|code|math|creative|visual|analyst|language)/i
      const agentMatch = message.body.match(agentPattern)

      if (agentMatch) {
        const agentId = agentMatch[1].toLowerCase()
        await team.processMessage(client, message, agentId)
      } else {
        // Let orchestrator decide
        await team.processMessage(client, message)
      }
      return
    }

    // Check if agents should naturally intervene
    if (await team.shouldAgentsIntervene(message)) {
      await team.addNaturalResponse(client, message)
      return
    }

    // Check if replying to bot message
    if (message.quotedMsgId) {
      const quotedMessage = await client.getMessageById(message.quotedMsgId)
      const WID = await client.getWid()

      // @ts-ignore
      if (quotedMessage.sender.id._serialized === WID) {
        await team.processMessage(client, message)
      }
    }
  } catch (error) {
    Logger.error(`Agent orchestrator error: ${error}`)
  }
}
