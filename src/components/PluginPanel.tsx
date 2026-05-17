import { Boxes, CheckCircle2, Cpu, Download, Puzzle, Shield, Sparkles, TerminalSquare, Trash2, X } from 'lucide-react'
import { useMemo } from 'react'
import type { PluginRecord } from '@shared/types'
import { useAppStore } from '@/store/app-store'

function ContributionSummary({ plugin }: { plugin: PluginRecord }) {
  const commands = plugin.contributes?.commands ?? []
  const panels = plugin.contributes?.panels ?? []
  const aiPresets = plugin.contributes?.aiPresets ?? []
  const aiProviders = plugin.contributes?.aiProviders ?? []

  if (!commands.length && !panels.length && !aiPresets.length && !aiProviders.length) return null

  return (
    <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
      {commands.length > 0 && (
        <div className="rounded-lg border bg-card/60 p-2">
          <div className="mb-1 font-medium text-foreground">Commands</div>
          <ul className="space-y-1 text-muted-foreground">
            {commands.slice(0, 4).map((command) => <li key={command.id}>• {command.title}</li>)}
            {commands.length > 4 && <li>• +{commands.length - 4} more</li>}
          </ul>
        </div>
      )}
      {panels.length > 0 && (
        <div className="rounded-lg border bg-card/60 p-2">
          <div className="mb-1 font-medium text-foreground">Panels</div>
          <ul className="space-y-1 text-muted-foreground">
            {panels.map((panel) => <li key={panel.id}>• {panel.title} / {panel.location}</li>)}
          </ul>
        </div>
      )}
      {aiPresets.length > 0 && (
        <div className="rounded-lg border bg-card/60 p-2">
          <div className="mb-1 font-medium text-foreground">AI Presets</div>
          <ul className="space-y-1 text-muted-foreground">
            {aiPresets.map((preset) => <li key={preset.id}>• {preset.label}</li>)}
          </ul>
        </div>
      )}
      {aiProviders.length > 0 && (
        <div className="rounded-lg border bg-card/60 p-2">
          <div className="mb-1 font-medium text-foreground">Model Providers</div>
          <ul className="space-y-1 text-muted-foreground">
            {aiProviders.map((provider) => <li key={provider.id}>• {provider.title} ({provider.models?.length ?? 0})</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export function PluginPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const { plugins, samplePlugins, setPluginEnabled, installSamplePlugin, uninstallPlugin } = useAppStore()
  const installedIds = useMemo(() => new Set(plugins.map((plugin) => plugin.id)), [plugins])
  const availableSamples = samplePlugins.filter((plugin) => !installedIds.has(plugin.id))
  const stats = useMemo(() => {
    const enabledPlugins = plugins.filter((plugin) => plugin.enabled)
    return {
      enabled: enabledPlugins.length,
      commands: enabledPlugins.reduce((count, plugin) => count + (plugin.contributes?.commands?.length ?? 0), 0),
      aiPresets: enabledPlugins.reduce((count, plugin) => count + (plugin.contributes?.aiPresets?.length ?? 0), 0),
      aiProviders: enabledPlugins.reduce((count, plugin) => count + (plugin.contributes?.aiProviders?.length ?? 0), 0),
    }
  }, [plugins])

  if (!open) return null

  return (
    <div className="absolute bottom-4 right-4 top-16 z-20 flex w-[660px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/40">
      <div className="shrink-0 flex items-center justify-between border-b p-4">
        <div>
          <div className="flex items-center gap-2 font-semibold"><Puzzle className="h-4 w-4 text-primary" /> Plugins</div>
          <p className="text-xs text-muted-foreground">Installed plugins start empty. Samples live under <code>plugins/samples/</code> and must be installed explicitly.</p>
        </div>
        <button type="button" className="rounded-md p-2 hover:bg-muted" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>

      <div className="titlebar-no-drag min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border bg-background p-3"><Boxes className="mb-2 h-4 w-4 text-primary" /><div className="text-lg font-semibold">{plugins.length}</div><p className="text-xs text-muted-foreground">installed</p></div>
          <div className="rounded-xl border bg-background p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" /><div className="text-lg font-semibold">{stats.enabled}</div><p className="text-xs text-muted-foreground">enabled</p></div>
          <div className="rounded-xl border bg-background p-3"><TerminalSquare className="mb-2 h-4 w-4 text-accent" /><div className="text-lg font-semibold">{stats.commands}</div><p className="text-xs text-muted-foreground">active commands</p></div>
          <div className="rounded-xl border bg-background p-3"><Cpu className="mb-2 h-4 w-4 text-violet-400" /><div className="text-lg font-semibold">{stats.aiPresets}/{stats.aiProviders}</div><p className="text-xs text-muted-foreground">AI presets/providers</p></div>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Installed</h3><span className="text-xs text-muted-foreground">Only enabled installed plugins can run.</span></div>
          {!plugins.length && <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No installed plugins yet. Install a sample below to test the plugin system.</div>}
          {plugins.map((plugin) => (
            <div key={plugin.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    {plugin.name}
                    {plugin.enabled && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{plugin.description}</p>
                  {plugin.installedPath && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{plugin.installedPath}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">v{plugin.version}</span>
                  <button type="button" className={plugin.enabled ? 'rounded-lg bg-destructive/15 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/25' : 'rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90'} onClick={() => void setPluginEnabled(plugin.id, !plugin.enabled)}>{plugin.enabled ? 'Disable' : 'Enable'}</button>
                  <button type="button" className="rounded-lg border px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/15 hover:text-destructive" onClick={() => void uninstallPlugin(plugin.id)} aria-label={`Uninstall ${plugin.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{plugin.permissions.map((permission) => <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground" key={permission}><Shield className="mr-1 inline h-3 w-3" />{permission}</span>)}</div>
              <ContributionSummary plugin={plugin} />
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Sample catalog</h3><span className="text-xs text-muted-foreground">Samples are not installed or enabled by default.</span></div>
          {availableSamples.map((plugin) => (
            <div key={plugin.id} className="rounded-xl border bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-semibold">{plugin.name}<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">sample</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{plugin.description}</p>
                  {plugin.installedPath && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{plugin.installedPath}</p>}
                </div>
                <button type="button" className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90" onClick={() => void installSamplePlugin(plugin.id)}><Download className="mr-1.5 inline h-3.5 w-3.5" />Install</button>
              </div>
              <ContributionSummary plugin={plugin} />
            </div>
          ))}
          {!availableSamples.length && <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">All samples are installed.</div>}
        </section>

        <div className="rounded-xl border bg-primary/5 p-3 text-xs text-muted-foreground"><Sparkles className="mr-2 inline h-4 w-4 text-primary" />Install a sample, then enable it. The command palette only shows commands from enabled installed plugins.</div>
      </div>
    </div>
  )
}
