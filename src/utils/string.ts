export const String = {
  normalize: (text: string) => {
    if (!text) return ''

    const source = text
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim()
    return source.slice(0, 500)
  },

  removeBreakLines: (text: string) => {
    return text.replace(/(\r\n|\n|\r)/gm, '')
  },

  countTokens: (text: string) => {
    return text.length / 2
  },

  countWords: (text: string) => {
    return text.split(/\s+/).length
  },

  countLines: (text: string) => {
    return text.split(/\r\n|\n|\r/).length
  },

  countCharacters: (text: string) => {
    return text.length
  },

  infoText: (text: string) => {
    return {
      tokens: String.countTokens(text),
      words: String.countWords(text),
      lines: String.countLines(text),
      characters: String.countCharacters(text),
    }
  },

  isCommand: (prefixes: string[], text?: string) => {
    if (!text) return false
    return prefixes.some((prefix) => text.startsWith(prefix))
  },

  include: (text: string, includes: string) => {
    return new RegExp(includes, 'i').test(text)
  },
}
