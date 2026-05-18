import { useEffect, useMemo, useRef } from 'react'
import type { RegisteredPanel } from '@/lib/plugin-runtime'
import { useAppStore } from '@/store/app-store'

function PanelMount({ panel }: { panel: RegisteredPanel }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!host.current) return
    const node = panel.render()
    node.dataset.lpPanelContent = panel.id
    host.current.replaceChildren(node)
    return () => {
      node.remove()
    }
  }, [panel])

  return (
    <section data-lp-plugin-panel={panel.id} data-lp-plugin-id={panel.pluginId} className="min-h-0 overflow-hidden border-b last:border-b-0">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/35 px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">{panel.title}</div>
          <div className="truncate text-[10px] text-muted-foreground">{panel.pluginName}</div>
        </div>
      </div>
      <div ref={host} className="min-h-0 overflow-auto p-3 text-xs text-muted-foreground" />
    </section>
  )
}

export function PluginDock({ location }: { location: RegisteredPanel['location'] }) {
  const allPanels = useAppStore((state) => state.pluginPanels)
  const panels = useMemo(() => allPanels.filter((panel) => panel.location === location), [allPanels, location])
  if (!panels.length) return null

  if (location === 'bottom') {
    return (
      <aside data-lp-slot="bottom-dock" className="titlebar-no-drag max-h-56 shrink-0 overflow-auto border-t bg-card/70">
        <div className="grid gap-0 md:grid-cols-2">
          {panels.map((panel) => <PanelMount key={`${panel.pluginId}:${panel.id}`} panel={panel} />)}
        </div>
      </aside>
    )
  }

  return (
    <aside data-lp-slot={`${location}-dock`} className="titlebar-no-drag hidden w-80 shrink-0 overflow-auto border-l bg-card/58 backdrop-blur-xl xl:block">
      {panels.map((panel) => <PanelMount key={`${panel.pluginId}:${panel.id}`} panel={panel} />)}
    </aside>
  )
}
