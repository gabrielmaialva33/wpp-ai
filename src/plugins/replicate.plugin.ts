import fs from 'node:fs'

import Replicate from 'replicate'
import jimp from 'jimp'

import { Env } from '../env.js'
import { Logger } from '../utils/index.js'

class ReplAI extends Replicate {
  constructor() {
    super({ auth: Env.REPLICATE_API_TOKEN })
  }

  async animation(path: string, prompt: string) {
    const file = fs.readFileSync(path)
    await jimp.read(file).then((image) => image.writeAsync(path))
    const image = await jimp.read(path)
    await image.resize(1024, 1024).writeAsync(path)

    const output = await this.run(
      'ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4',
      {
        input: {
          image: fs.createReadStream(path),
          prompt: prompt,
          max_frames: 16,
          guidance_scale: 9,
          num_inference_steps: 50,
        },
      }
    ).catch(Logger.error)

    console.log(output)

    return output
  }
}

export const Repl = new ReplAI()
