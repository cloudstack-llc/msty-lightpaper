import { Bot, Eye, GitBranch, PanelLeftClose, Save, Settings, SplitSquareHorizontal, Type, Wand2 } from 'lucide-react'
import type { EditorMode, ThemeId } from '@shared/types'
import { basename, wordCount } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const themes: ThemeId[] = ['obsidian', 'paper', 'midnight', 'solar', 'forest']

export function Toolbar({ onAi, onPlugins }: { onAi(): void; onPlugins(): void }) {
  const { activeFile, content, savedContent, settings, save, updateSettings } = useAppStore()
  const dirty = content !== savedContent
  const setMode = (editorMode: EditorMode) => updateSettings({ editorMode })
  return <header className="titlebar-drag flex h-14 shrink-0 items-center justify-between border-b bg-background/72 px-4 backdrop-blur-xl">
    <div className="flex min-w-0 items-center gap-3">
      <div className="rounded-xl border bg-card p-2 shadow-glow"><PanelLeftClose className="h-4 w-4 text-primary" /></div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{activeFile ? basename(activeFile) : 'Choose or create a note'}</div>
        <div className="text-xs text-muted-foreground">{wordCount(content)} words {dirty ? '• unsaved' : '• saved'}</div>
      </div>
    </div>
    <div className="titlebar-no-drag flex items-center gap-2">
      <div className="flex rounded-xl border bg-card p-1">
        <button className={`rounded-lg px-3 py-1.5 text-xs ${settings?.editorMode === 'write' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setMode('write')}><Type className="mr-1 inline h-3.5 w-3.5" />Write</button>
        <button className={`rounded-lg px-3 py-1.5 text-xs ${settings?.editorMode === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setMode('preview')}><Eye className="mr-1 inline h-3.5 w-3.5" />Preview</button>
        <button className={`rounded-lg px-3 py-1.5 text-xs ${settings?.editorMode === 'split' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setMode('split')}><SplitSquareHorizontal className="mr-1 inline h-3.5 w-3.5" />Split</button>
      </div>
      <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
        Theme
        <select className="bg-transparent text-foreground outline-none" value={settings?.theme ?? 'obsidian'} onChange={(e) => updateSettings({ theme: e.target.value as ThemeId })}>{themes.map((t) => <option key={t} value={t}>{t}</option>)}</select>
      </label>
      <button className="rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted" onClick={onAi}><Bot className="mr-1.5 inline h-4 w-4 text-accent" />AI</button>
      <button className="rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted" onClick={onPlugins}><GitBranch className="mr-1.5 inline h-4 w-4 text-primary" />Plugins</button>
      <button className="rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted" onClick={() => updateSettings({ syncScroll: !settings?.syncScroll })}><Wand2 className="mr-1.5 inline h-4 w-4" />Sync {settings?.syncScroll ? 'on' : 'off'}</button>
      <button className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-45" disabled={!activeFile || !dirty} onClick={save}><Save className="mr-1.5 inline h-4 w-4" />Save</button>
      <Settings className="h-4 w-4 text-muted-foreground" />
    </div>
  </header>
}
