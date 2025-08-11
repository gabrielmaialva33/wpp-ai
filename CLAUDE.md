# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Scripts

- `pnpm build` - Compile TypeScript to JavaScript (output in `build/`)
- `pnpm start` - Run the compiled application
- `pnpm start:dev` - Run in development mode with TypeScript loader
- `pnpm lint` - Run ESLint on all TypeScript files
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Remove dist directory

### Development Workflow

1. Install dependencies: `pnpm install`
2. Set up environment variables: Copy `.env.example` to `.env` and configure:
   - `WPP_SESSION`: WhatsApp session name
   - `BOT_NAME`: Primary bot name
   - `BOT_NAMES`: JSON array of bot names
   - `PREFIXES`: JSON array of command prefixes
   - `GEMINI_API_KEY`: Google Gemini API key
   - `NVIDIA_API_KEY`: NVIDIA NIM API key
   - `DEFAULT_TEXT_PROVIDER`: Default AI for text (gemini/nvidia)
   - `DEFAULT_IMAGE_PROVIDER`: Default AI for images (nvidia)
3. Run in development: `pnpm start:dev`

## Architecture Overview

### Core Components

**Bot System (`src/bot.ts`)**

- Central WhatsApp bot orchestrator using WPPConnect library
- Dynamically loads commands from `src/commands/` directory
- Dynamically loads middlewares from `src/middlewares/` directory
- Handles message routing and command execution
- Manages session state and connection lifecycle

**Command System**
Commands are self-contained modules in `src/commands/` that export:

- `name`: Command identifier
- `description`: Command help text
- `execute(client: Whatsapp, message: Message)`: Handler function

**Middleware System**
Middlewares in `src/middlewares/` process all incoming messages:

- `ai-chat.ts`: Handles conversational AI interactions using Gemini
- `history.ts`: Manages conversation history
- Each exports an `execute(client: Whatsapp, message: Message)` function

**Plugin Architecture**

- `gemini.plugin.ts`: Google Gemini integration for text generation
- `nvidia.plugin.ts`: NVIDIA NIM integration for text and image generation
- Plugins implement the IAIProvider interface for consistency

### Key Patterns

**Message Flow**

1. Message received → All middlewares execute in parallel
2. If message starts with prefix → Command handler executes
3. AI middleware checks for bot mentions or reply context
4. Responses sent with proper quotation/context

**Context Management**

- `utils/context.ts`: Extracts user, group, and message context
- `utils/history.ts`: Persists conversation history to `tmp/` files
- History files used for maintaining conversation continuity

**File Resolution**
Dynamic path resolution handles both development and production:

- Development: Direct TypeScript file access
- Production: Compiled JavaScript in `build/` directory

### Directory Structure

```
src/
├── bot.ts              # Main bot orchestrator
├── index.ts            # Application entry point
├── env.ts              # Environment configuration
├── commands/           # Command modules (animate, help, image, etc.)
├── middlewares/        # Message processors
├── plugins/            # External service integrations
└── utils/              # Shared utilities
```

## AI Providers Integration

### Available AI Providers

The bot now supports multiple AI providers with automatic fallback:

**Text Generation:**

- **Google Gemini** - Models: gemini-2.5-pro, gemini-2.5-flash
- **NVIDIA NIM** - Models: llama-3.3, deepseek-r1, mixtral

**Image Generation:**

- **NVIDIA NIM** - Stable Diffusion XL via NVIDIA

### Bot Commands

**AI Commands:**

- `!ai [provider] <pergunta>` - Chat with specific AI provider
- `!compare <pergunta>` - Compare responses from all available AIs
- `!image [provider] <descrição>` - Generate images with AI
- `!help` - List all available commands

**Command Examples:**

```
!ai gemini Qual é a capital do Brasil?
!ai nvidia Explique computação quântica
!compare O que é inteligência artificial?
!image nvidia um gato astronauta no espaço
!image openai cidade futurista ao pôr do sol
```

### Provider Selection

The system automatically selects the best provider based on:

- Availability and API limits
- Cost optimization
- Task requirements (text vs image)
- User preferences via DEFAULT_TEXT_PROVIDER and DEFAULT_IMAGE_PROVIDER

### Rate Limiting

Built-in rate limiting per user per provider:

- Prevents API quota exhaustion
- Configurable limits per minute/hour/day
- Automatic queueing and retry logic

## Technical Considerations

- **Node.js 22.13.1+** required for ESM module support
- Uses TypeScript with ESM modules (`"type": "module"` in package.json)
- AdonisJS ESLint/Prettier configuration for consistent code style
- WPPConnect library for WhatsApp Web automation
- Temporary files stored in `tmp/` for history and media processing
- Jimp for image processing operations
- Telegraph for image hosting when needed
- Google Generative AI SDK for Gemini integration
- Native fetch for NVIDIA NIM API calls
- Rate limiting with per-user tracking
