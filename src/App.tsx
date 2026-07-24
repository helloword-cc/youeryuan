import { useEffect, useRef, useState } from 'react'
import {
  IconArrowRight,
  IconBlocks,
  IconCheck,
  IconEye,
  IconHandFinger,
  IconMicrophone,
  IconMoodNervous,
  IconPaw,
  IconPlayerPlay,
  IconRoad,
  IconVolume,
  IconX,
} from '@tabler/icons-react'
import { 积木场景, type 线索编号 } from './data'

type 环节 = '开场' | '观察' | '靠近' | '开口' | '一起搭'
type 记录 = { 日期: string; 已看线索: 线索编号[]; 备注: string }
const 记录键 = '慢慢来-停车场任务'

export default function App() {
  const [环节, 设置环节] = useState<环节>('开场')
  const [已看线索, 设置已看线索] = useState<线索编号[]>([])
  const [家长页, 设置家长页] = useState(false)
  const [备注, 设置备注] = useState('')
  const 配音 = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const 原记录 = localStorage.getItem(记录键)
    if (!原记录) return
    try { 设置备注((JSON.parse(原记录) as 记录).备注 || '') } catch { localStorage.removeItem(记录键) }
  }, [])

  useEffect(() => {
    if (环节 !== '开口') return
    void 播放小熊()
  }, [环节])

  const 播放小熊 = async () => {
    if (!配音.current) return
    配音.current.currentTime = 0
    try { await 配音.current.play() } catch { /* 用户可点击大声按钮重播 */ }
  }

  const 保存 = () => localStorage.setItem(记录键, JSON.stringify({ 日期: new Date().toISOString(), 已看线索, 备注 } satisfies 记录))
  const 重来 = () => { 设置已看线索([]); 设置环节('开场') }
  const 看线索 = (编号: 线索编号) => 设置已看线索((当前) => 当前.includes(编号) ? 当前 : [...当前, 编号])
  const 已看完 = 已看线索.length === 积木场景.线索.length

  return <main className="应用">
    <video
      className="场景底图 场景视频"
      src="/media/video/斜坡卡住.mp4"
      poster="/assets/积木区观察镜头.png"
      autoPlay
      loop
      muted={环节 === '开场' || 环节 === '开口'}
      playsInline
      aria-label="积木区里，停车场的斜坡轻轻滑落，小熊抱着长积木观察"
    />
    <div className="遮罩" />
    <header className="顶栏">
      <button className="标志" onClick={重来} aria-label="重新开始"><IconPaw size={22} stroke={2.3} /><span>慢慢来</span></button>
      <div className="进度" aria-label={`第${['开场', '观察', '靠近', '开口', '一起搭'].indexOf(环节) + 1}步`}>
        {['开场', '观察', '靠近', '开口', '一起搭'].map((步骤) => <i key={步骤} className={步骤 === 环节 ? '当前' : ['开场', '观察', '靠近', '开口', '一起搭'].indexOf(步骤) < ['开场', '观察', '靠近', '开口', '一起搭'].indexOf(环节) ? '完成' : ''} />)}
      </div>
      <button className="家长入口" onClick={() => 设置家长页(true)}>给爸爸妈妈</button>
    </header>

    <section className={`故事层 ${环节}`}>
      {环节 === '开场' && <儿童提示>
        <button className="巨大按钮" onClick={() => 设置环节('观察')} aria-label="开始看一看"><IconEye size={70} /><span className="仅屏幕阅读器">开始看一看</span></button>
      </儿童提示>}

      {环节 === '观察' && <观察画面 已看={已看线索} 看线索={看线索} 已看完={已看完} 继续={() => 设置环节('靠近')} />}

      {环节 === '靠近' && <儿童提示>
        <button className="巨大按钮 积木动作" onClick={() => 设置环节('开口')} aria-label="拿着长积木靠近"><IconBlocks size={70} /><IconHandFinger className="手势" size={39} /><span className="仅屏幕阅读器">拿着长积木靠近</span></button>
      </儿童提示>}

      {环节 === '开口' && <儿童提示 className="开口提示">
        <button className="巨大按钮 声音按钮" onClick={播放小熊} aria-label="再听一次小熊怎么说"><IconVolume size={70} /><span className="仅屏幕阅读器">再听一次</span></button>
        <button className="跟说按钮" onClick={() => { 保存(); 设置环节('一起搭') }} aria-label="我也来说一说"><IconMicrophone size={42} /><span className="仅屏幕阅读器">我也来说一说</span></button>
      </儿童提示>}

      {环节 === '一起搭' && <儿童提示>
        <button className="巨大按钮 完成按钮" onClick={重来} aria-label="再玩一次"><IconPaw size={70} /><IconCheck className="完成勾" size={39} /><span className="仅屏幕阅读器">再玩一次</span></button>
        <button className="家长演练按钮" onClick={() => 设置家长页(true)} aria-label="和爸爸妈妈演一演"><IconArrowRight size={32} /><span className="仅屏幕阅读器">和爸爸妈妈演一演</span></button>
      </儿童提示>}
    </section>

    <audio ref={配音} src="/media/audio/小熊开口.mp3" preload="auto" />
    {家长页 && <家长抽屉 备注={备注} 设置备注={设置备注} 关闭={() => { 保存(); 设置家长页(false) }} />}
  </main>
}

function 儿童提示({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`儿童提示 ${className}`}>{children}</div>
}

function 观察画面({ 已看, 看线索, 已看完, 继续 }: { 已看: 线索编号[]; 看线索: (编号: 线索编号) => void; 已看完: boolean; 继续: () => void }) {
  const 图标 = { 斜坡: IconRoad, 积木: IconBlocks, 表情: IconMoodNervous }
  return <div className="观察热区" aria-label="在画面里找一找">
    {积木场景.线索.map((线索) => {
      const 图标组件 = 图标[线索.编号]
      const 已发现 = 已看.includes(线索.编号)
      return <button key={线索.编号} className={`热区 ${线索.编号} ${已发现 ? '已发现' : ''}`} onClick={() => 看线索(线索.编号)} aria-label={`找到了：${线索.标题}`}>
        {已发现 ? <IconCheck size={29} /> : <图标组件 size={31} />}
      </button>
    })}
    {已看完 && <button className="继续按钮" onClick={继续} aria-label="小熊找到办法了，继续"><IconPaw size={40} /><IconArrowRight size={30} /></button>}
  </div>
}

function 家长抽屉({ 备注, 设置备注, 关闭 }: { 备注: string; 设置备注: (备注: string) => void; 关闭: () => void }) {
  return <aside className="家长抽屉" role="dialog" aria-modal="true" aria-label="家长提示">
    <button className="关闭" onClick={关闭} aria-label="关闭"><IconX size={28} /></button>
    <p className="小标题">给爸爸妈妈</p>
    <h2>这一轮练的不是背台词</h2>
    <p>孩子先看见别人正在忙什么，再带着自己能提供的帮助走近。小熊说“这个能帮上忙吗？”不是一定要加入游戏，而是自然地打开一段互动。</p>
    <h3>第一轮怎么演</h3><p>{积木场景.家长提示.第一轮}</p>
    <h3>孩子停住时</h3><p>{积木场景.家长提示.停住时}</p>
    <h3>想再试一次</h3><p>{积木场景.家长提示.第二轮}</p>
    <label>今天的小记录<textarea value={备注} onChange={(事件) => 设置备注(事件.target.value)} placeholder="例如：他愿意先看画面，但不想马上开口。" /></label>
    <button className="主按钮" onClick={关闭}>保存记录</button>
  </aside>
}
