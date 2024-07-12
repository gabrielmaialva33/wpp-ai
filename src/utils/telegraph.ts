import FormData from 'form-data'
import fetch from 'node-fetch'

export const Telegraph = {
  uploadByBuffer: async (buffer: Buffer, contentType: string, agent?: string) => {
    if (!Buffer.isBuffer(buffer)) throw new TypeError('Buffer is not a Buffer')

    const form = new FormData()
    form.append('photo', buffer, {
      filename: 'blob',
      contentType,
      ...(agent && { agent }),
    })

    return fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    })
      .then((result) => result.json())
      .then((result) => {
        //@ts-ignore
        if (result.error) throw result.error
        //@ts-ignore
        if (result[0] && result[0].src) {
          return {
            //@ts-ignore
            link: 'https://telegra.ph' + result[0].src,
            //@ts-ignore
            path: result[0].src,
          }
        }

        throw new Error('Unknown error')
      })
  },
}
