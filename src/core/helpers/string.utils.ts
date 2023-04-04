export const StringUtils = {
  FormatQuery: (str: string) => {
    if (str === undefined) return ''

    const regex = /(\r\n|\n|\r)/gm
    return str.replace(regex, ' ').replace(/\s+/g, ' ')
  },

  FormatBindings: (bindings: any[]) => {
    if (bindings === undefined) return ''

    const regex = /(\r\n|\n|\r)/gm
    const str = bindings
      .map((item) => {
        if (typeof item === 'string') return item.replace(regex, ' ').replace(/\s+/g, ' ')
        return item
      })
      .join(', ')
    return `[${str}]`
  },

  IsNotEmpty: (str: string) => {
    if (str === undefined) return false
    if (str === null) return false
    if (str === 'undefined') return false
    if (str === 'null') return false
    if (str === '') return false
    return str.trim() !== ''
  },
}
