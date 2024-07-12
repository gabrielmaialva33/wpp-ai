import Replicate from 'replicate'

import { Env } from '../env.js'
import { Logger } from '../utils/index.js'

class ReplAI extends Replicate {
  constructor() {
    super({ auth: Env.REPLICATE_API_TOKEN })
  }

  async animation(url: string, prompt: string) {
    const output = await this.run(
      'ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4',
      {
        input: {
          image: url,
          prompt: prompt,
          max_frames: 24,
          guidance_scale: 9,
          num_inference_steps: 50,
        },
      }
    ).catch(Logger.error)

    return output
  }

  async animation2(url: string, prompt: string) {
    const output = await this.run(
      'camenduru/dynami-crafter-576x1024:e79ff8d01e81cbd90acfa1df4f209f637da2c68307891d77a6e4227f4ec350f1',
      {
        input: {
          i2v_eta: 1,
          i2v_seed: 123,
          i2v_steps: 50,
          i2v_motion: 4,
          i2v_cfg_scale: 7.5,
          i2v_input_text: prompt,
          i2v_input_image: url,
        },
      }
    )

    console.log(output)

    return output
  }
}

export const Repl = new ReplAI()
