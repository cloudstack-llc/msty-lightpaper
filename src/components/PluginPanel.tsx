import { Boxes, CheckCircle2, Cpu, Download, Puzzle, Shield, X } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function PluginPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const { plugins } = useAppStore()
  if (!open) return null
  return <div className="absolute bottom-4 right-4 top-16 z-20 w-[520px] overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/40">
    <div className="flex items-center justify-between border-b p-4"><div><div className="flex items-center gap-2 font-semibold"><Puzzle className="h-4 w-4 text-primary" /> Plugin Marketplace / Lab</div><p className="text-xs text-muted-foreground">Manifest-first architecture with permissions, commands, markdown hooks, AI presets, panels, themes.</p></div><button onClick={onClose}><X className="h-4 w-4" /></button></div>
    <div className="space-y-3 overflow-auto p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-background p-3"><Cpu className="mb-2 h-4 w-4 text-accent" /><div className="text-sm font-medium">AI providers</div><p className="text-xs text-muted-foreground">OpenAI-compatible, Ollama, local, custom.</p></div>
        <div className="rounded-xl border bg-background p-3"><Boxes className="mb-2 h-4 w-4 text-primary" /><div className="text-sm font-medium">UI panels</div><p className="text-xs text-muted-foreground">Graph, calendar, tasks, publishing.</p></div>
        <div className="rounded-xl border bg-background p-3"><Shield className="mb-2 h-4 w-4 text-emerald-400" /><div className="text-sm font-medium">Permissions</div><p className="text-xs text-muted-foreground">Explicit capability model.</p></div>
      </div>
      {plugins.map((plugin) => <div key={plugin.id} className="rounded-xl border bg-background p-4">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-semibold">{plugin.name}{plugin.enabled && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}</div><p className="mt-1 text-sm text-muted-foreground">{plugin.description}</p></div><span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">v{plugin.version}</span></div>
        <div className="mt-3 flex flex-wrap gap-1.5">{plugin.permissions.map((p) => <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground" key={p}>{p}</span>)}</div>
      </div>)}
      <button className="w-full rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground"><Download className="mr-2 inline h-4 w-4" />Install plugin from folder / registry coming next</button>
    </div>
  </div>
}
