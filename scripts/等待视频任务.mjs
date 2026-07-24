import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const 任务编号 = process.argv[2]
if (!任务编号) throw new Error('请提供视频任务编号。')

const 根目录 = resolve(import.meta.dirname, '..')
const 输出文件 = resolve(根目录, 'public/media/video/斜坡卡住.mp4')
const 环境文件 = await readFile(resolve(根目录, '.env'), 'utf8')
const 密钥 = 环境文件.match(/^DASHSCOPE_API_KEY=(.+)$/m)?.[1]?.trim()
if (!密钥) throw new Error('未在 .env 中找到 DASHSCOPE_API_KEY。')

const 接口 = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
let 结果
for (let 次数 = 0; 次数 < 120; 次数 += 1) {
  await new Promise((完成) => setTimeout(完成, 5000))
  const 查询回应 = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${任务编号}`, { headers: { Authorization: `Bearer ${密钥}` } })
  结果 = await 查询回应.json()
  if (结果.output?.task_status === 'SUCCEEDED') break
  if (['FAILED', 'UNKNOWN'].includes(结果.output?.task_status)) {
    throw new Error(`视频生成失败：${结果.code || ''} ${结果.message || ''}`)
  }
}

const 视频地址 = 结果?.output?.video_url
if (!视频地址) throw new Error('视频仍在生成队列中，请稍后用同一任务编号继续等待。')

const 视频回应 = await fetch(视频地址)
if (!视频回应.ok) throw new Error('无法下载生成的视频文件。')

await mkdir(dirname(输出文件), { recursive: true })
await writeFile(输出文件, Buffer.from(await 视频回应.arrayBuffer()))
console.log(`已下载视频：${输出文件}`)
