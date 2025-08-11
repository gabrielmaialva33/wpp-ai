<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/gabrielmaialva33/wpp-ai/main/.github/assets/ai.png" alt="AI" width="200">
  <br>
  Another chatbot for <a href="https://www.whatsapp.com/?lang=pt_BR">WhatsApp</a>
  <br>
</h1>

<p align="center">
  <strong>A complete chatbot for WhatsApp using Node.js, Typescript and following general best practices.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/gabrielmaialva33/wpp-ai?color=00b8d3?style=flat&logo=appveyor" alt="License" />
  <img src="https://img.shields.io/github/languages/top/gabrielmaialva33/wpp-ai?style=flat&logo=appveyor" alt="GitHub top language" >
  <img src="https://img.shields.io/github/languages/count/gabrielmaialva33/wpp-ai?style=flat&logo=appveyor" alt="GitHub language count" >
  <img src="https://img.shields.io/github/repo-size/gabrielmaialva33/wpp-ai?style=flat&logo=appveyor" alt="Repository size" >
  <a href="https://github.com/gabrielmaialva33/wpp-ai/commits/master">
    <img src="https://img.shields.io/github/last-commit/gabrielmaialva33/wpp-ai?style=flat&logo=appveyor" alt="GitHub last commit" >
    <img src="https://img.shields.io/badge/made%20by-Maia-15c3d6?style=flat&logo=appveyor" alt="Maia" >  
  </a>
</p>

<br>

<p align="center">
  <a href="#bookmark-about">About</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#computer-technologies">Technologies</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#wrench-tools">Tools</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#package-installation">Installation</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#memo-license">License</a>
</p>

<br>

## :bookmark: About

**Wpp AI** is a complete chatbot for WhatsApp using Node.js, Typescript and following general best practices.

<br>

## :computer: Technologies

- **[Typescript](https://www.typescriptlang.org/)**
- **[Node.js](https://nodejs.org/)**
- **[Eslint](https://eslint.org/)**
- **[Prettier](https://prettier.io/)**
- **[Japa](https://japa.dev/)**

<br>

## :wrench: Tools

- **[WebStorm](https://www.jetbrains.com/webstorm/)**

<br>

## :package: Installation

### :heavy_check_mark: **Prerequisites**

The following software must be installed:

- **[Node.js v22.13.1+](https://nodejs.org/en/)**
- **[Git](https://git-scm.com/)**
- **[PNPM](https://pnpm.io/)** (recommended) or **[NPM](https://www.npmjs.com/)**

<br>

### :arrow_down: **Cloning the repository**

```sh
$ git clone https://github.com/gabrielmaialva33/wpp-ai.git
```

<br>

### :gear: **Configuration**

1. Copy the environment file:
```sh
$ cp .env.example .env
```

2. Configure your API keys in `.env`:
```env
# Required Keys
WPP_SESSION=wpp_ai
BOT_NAME=AI
BOT_NAMES='["AI", "Bot", "Assistant"]'
PREFIXES='["!", "/", "$"]'

# AI Provider Keys
GEMINI_API_KEY=your-gemini-key
NVIDIA_API_KEY=your-nvidia-key

# Defaults
DEFAULT_TEXT_PROVIDER=gemini
DEFAULT_IMAGE_PROVIDER=nvidia
```

<br>

### :arrow_forward: **Running the application**

```sh
$ cd wpp-ai
# Install dependencies
$ pnpm install

# Development mode
$ pnpm start:dev

# Build and run production
$ pnpm build
$ pnpm start
```

<br>

## :robot: **Available Commands**

### AI Commands
- `!ai [provider] <question>` - Chat with AI (Gemini or NVIDIA)
- `!compare <question>` - Compare responses from Gemini and NVIDIA
- `!image <description>` - Generate images with NVIDIA

### Examples
```
!ai gemini What is artificial intelligence?
!ai nvidia Explain quantum computing
!compare What's the meaning of life?
!image a futuristic city at sunset
!image cute robot playing guitar
```

### Supported Providers
**Text Generation:**
- Google Gemini (gemini-2.5-pro, gemini-2.5-flash)
- NVIDIA NIM (Llama 3.3, DeepSeek R1, Mixtral)

**Image Generation:**
- NVIDIA (Stable Diffusion XL)

<br>

### :writing_hand: **Author**

| [![Gabriel Maia](https://avatars.githubusercontent.com/u/26732067?size=100)](https://github.com/gabrielmaialva33) |
| ----------------------------------------------------------------------------------------------------------------- |
| [Gabriel Maia](https://github.com/gabrielmaialva33)                                                               |

## License

[MIT License](./LICENSE)
