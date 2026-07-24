import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const 根目录 = resolve(import.meta.dirname, '..')
const 输出文件 = resolve(根目录, 'public/media/audio/小熊开口.mp3')
const 环境文件 = await readFile(resolve(根目录, '.env'), 'utf8')
const 密钥 = 环境文件.match(/^DASHSCOPE_API_KEY=(.+)$/m)?.[1]?.trim()

if (!密钥) throw new Error('未在 .env 中找到 DASHSCOPE_API_KEY。')

const 回应 = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer', {
  method: 'POST',
  headers: { Authorization: `Bearer ${密钥}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen-audio-3.0-tts-flash',
    input: {
      text: '这个能帮上忙吗？',
      voice: 'longjielidou_v3.6',
      format: 'mp3',
      sample_rate: 24000,
      rate: 0.92,
      language_hints: ['zh'],
    },
  }),
})

const 结果 = await 回应.json()
if (!回应.ok || !结果.output?.audio?.url) {
  throw new Error(`配音生成失败：${结果.code || 回应.status} ${结果.message || ''}`)
}

const 音频回应 = await fetch(结果.output.audio.url)
if (!音频回应.ok) throw new Error('无法下载生成的配音文件。')

await mkdir(dirname(输出文件), { recursive: true })
await writeFile(输出文件, Buffer.from(await 音频回应.arrayBuffer()))
console.log(`已生成配音：${输出文件}`)
