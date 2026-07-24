import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const 根目录 = resolve(import.meta.dirname, '..')
const 首帧文件 = resolve(根目录, 'public/assets/积木区观察镜头.png')
const 输出文件 = resolve(根目录, 'public/media/video/斜坡卡住.mp4')
const 环境文件 = await readFile(resolve(根目录, '.env'), 'utf8')
const 密钥 = 环境文件.match(/^DASHSCOPE_API_KEY=(.+)$/m)?.[1]?.trim()

if (!密钥) throw new Error('未在 .env 中找到 DASHSCOPE_API_KEY。')

const 首帧 = await readFile(首帧文件)
const 首帧数据 = `data:image/png;base64,${首帧.toString('base64')}`
const 接口 = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
const 提交回应 = await fetch(接口, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${密钥}`,
    'Content-Type': 'application/json',
    'X-DashScope-Async': 'enable',
  },
  body: JSON.stringify({
    model: 'wan2.7-i2v-2026-04-25',
    input: {
      prompt: '温暖、精致的幼儿园积木区。保持画面中两个孩子、小熊和停车场积木的角色外观不变。两个孩子专心修理停车场入口，一块斜坡积木轻轻滑落，男孩和女孩自然地看向斜坡，小熊抱着蓝绿色长积木认真观察。固定中景镜头，细腻自然的小动作，晨光、真实教室环境音，没有字幕，没有文字，没有镜头切换。',
      negative_prompt: '变形的手，额外的人物，角色变脸，文字，字幕，夸张表情，快速运动，镜头切换',
      media: [{ type: 'first_frame', url: 首帧数据 }],
    },
    parameters: { resolution: '720P', duration: 3, prompt_extend: true, watermark: true },
  }),
})

const 任务 = await 提交回应.json()
if (!提交回应.ok || !任务.output?.task_id) {
  throw new Error(`视频任务创建失败：${任务.code || 提交回应.status} ${任务.message || ''}`)
}

console.log(`视频任务已提交：${任务.output.task_id}`)
let 结果
for (let 次数 = 0; 次数 < 40; 次数 += 1) {
  await new Promise((完成) => setTimeout(完成, 5000))
  const 查询回应 = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${任务.output.task_id}`, { headers: { Authorization: `Bearer ${密钥}` } })
  结果 = await 查询回应.json()
  if (结果.output?.task_status === 'SUCCEEDED') break
  if (['FAILED', 'UNKNOWN'].includes(结果.output?.task_status)) {
    throw new Error(`视频生成失败：${结果.code || ''} ${结果.message || ''}`)
  }
}

const 视频地址 = 结果?.output?.video_url
if (!视频地址) throw new Error('视频生成超时，请在百炼控制台用任务编号查询。')

const 视频回应 = await fetch(视频地址)
if (!视频回应.ok) throw new Error('无法下载生成的视频文件。')

await mkdir(dirname(输出文件), { recursive: true })
await writeFile(输出文件, Buffer.from(await 视频回应.arrayBuffer()))
console.log(`已生成视频：${输出文件}`)
