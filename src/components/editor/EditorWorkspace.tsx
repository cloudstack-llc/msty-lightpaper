import { Group, Panel, Separator } from 'react-resizable-panels'
import { useMemo, useState } from 'react'
import { MarkdownEditor } from './MarkdownEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { useAppStore } from '@/store/app-store'

function safeSplitRatio(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 50
  if (value < 25 || value > 75) return 50
  return value
}

export function EditorWorkspace() {
  const { activeFile, content, setContent, settings, updateSettings } = useAppStore()
  const [scrollRatio, setScrollRatio] = useState(0)
  const splitRatio = useMemo(() => safeSplitRatio(settings?.splitRatio), [settings?.splitRatio])
  if (!activeFile) return <main data-lp-view="empty" className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/.14),transparent_40%)]"><div className="max-w-lg text-center"><div className="mb-5 inline-flex rounded-2xl border bg-card px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">Plugin-first markdown studio</div><h1 className="text-5xl font-black tracking-[0]">Write locally. Extend wildly.</h1><p className="mt-4 text-muted-foreground">Open a folder from the sidebar. LightPaper keeps your notes as plain markdown, then layers themes, AI, backlinks, commands, and plugin workflows on top.</p></div></main>
  const mode = settings?.editorMode ?? 'split'
  if (mode === 'write') return <MarkdownEditor value={content} onChange={setContent} />
  if (mode === 'preview') return <MarkdownPreview value={content} />
  return <Group key={`split-${splitRatio}`} orientation="horizontal" onLayoutChanged={(layout: Record<string, number>) => {
    const next = safeSplitRatio(layout.editor)
    if (next !== settings?.splitRatio) void updateSettings({ splitRatio: next })
  }}>
    <Panel id="editor" defaultSize={splitRatio} minSize={25}><MarkdownEditor value={content} onChange={setContent} onScroll={(ratio) => settings?.syncScroll && setScrollRatio(ratio)} /></Panel>
    <Separator className="w-1 bg-border transition hover:bg-primary" />
    <Panel id="preview" defaultSize={100 - splitRatio} minSize={25}><MarkdownPreview value={content} scrollRatio={settings?.syncScroll ? scrollRatio : undefined} /></Panel>
  </Group>
}
