import { Bot, FileSignature, Sparkles, Tags, Wand2, X } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'

const presets = [
  { id: 'summary', label: 'Summarize note', icon: FileSignature, prompt: 'Summarize this note with crisp bullets.' },
  { id: 'tags', label: 'Generate tags', icon: Tags, prompt: 'Extract useful tags.' },
  { id: 'rewrite', label: 'Rewrite sharper', icon: Wand2, prompt: 'Rewrite this markdown to be clearer, more vivid, and more concise.' },
]

export function AiPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const { content, setContent, activeFile } = useAppStore()
  const [result, setResult] = useState('')
  const [prompt, setPrompt] = useState('Make this better without losing my voice.')
  if (!open) return null
  async function run(presetId?: string) {
    const output = await window.lightpaper.runAi({ presetId, prompt, text: content, document: content, path: activeFile })
    setResult(output.tags?.length ? output.tags.map((t: string) => `#${t}`).join(' ') : output.text)
  }
  return <div className="absolute right-4 top-16 z-20 w-[420px] overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/40">
    <div className="flex items-center justify-between border-b p-4"><div><div className="flex items-center gap-2 font-semibold"><Bot className="h-4 w-4 text-accent" /> LightPaper AI Lab</div><p className="text-xs text-muted-foreground">Offline stub now, provider plugins later.</p></div><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></div>
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-2">{presets.map((p) => <button type="button" key={p.id} className="rounded-xl border bg-background p-3 text-left text-xs hover:border-primary" onClick={() => run(p.id)}><p.icon className="mb-2 h-4 w-4 text-primary" />{p.label}</button>)}</div>
      <textarea className="h-24 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="flex gap-2"><button type="button" className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => run()}><Sparkles className="mr-1.5 inline h-4 w-4" />Run custom prompt</button><button type="button" className="rounded-xl border px-3 py-2 text-sm hover:bg-muted" onClick={() => result && setContent(result)}>Replace document</button></div>
      {result && <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border bg-background p-3 text-xs text-muted-foreground">{result}</pre>}
    </div>
  </div>
}
