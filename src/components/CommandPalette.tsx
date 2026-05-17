import { Search, TerminalSquare, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'

export function CommandPalette({ open, onClose }: { open: boolean; onClose(): void }) {
  const { pluginCommands, executePluginCommand, activeFile } = useAppStore()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pluginCommands
    return pluginCommands.filter((command) => [command.title, command.id, command.pluginName, command.category].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [pluginCommands, query])
  if (!open) return null
  return <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm" onMouseDown={onClose}>
    <div className="mx-auto mt-24 w-[720px] overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/50" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-3 border-b p-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input autoFocus className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Run a plugin command…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="rounded-md p-2 hover:bg-muted" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <div className="max-h-[520px] overflow-auto p-2">
        {!activeFile && <div className="m-2 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Open a Markdown file before running document commands.</div>}
        {filtered.map((command) => <button key={`${command.pluginId}:${command.id}`} type="button" className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-muted" disabled={!activeFile} onClick={async () => { await executePluginCommand(command.id); onClose() }}>
          <TerminalSquare className="mt-0.5 h-4 w-4 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{command.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{command.pluginName} · {command.category ?? 'Command'} · {command.id}</span>
          </span>
        </button>)}
        {!filtered.length && <div className="p-8 text-center text-sm text-muted-foreground">No plugin commands match that search.</div>}
      </div>
    </div>
  </div>
}
