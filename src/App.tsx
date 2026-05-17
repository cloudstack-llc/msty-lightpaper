import { useEffect, useState } from 'react'
import { AiPanel } from './components/AiPanel'
import { EditorWorkspace } from './components/editor/EditorWorkspace'
import { PluginPanel } from './components/PluginPanel'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { useAppStore } from './store/app-store'

export default function App() {
  const { hydrate, settings } = useAppStore()
  const [aiOpen, setAiOpen] = useState(false)
  const [pluginsOpen, setPluginsOpen] = useState(false)
  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    document.documentElement.className = `theme-${settings?.theme ?? 'obsidian'} dark`
  }, [settings?.theme])
  return <div className="flex h-screen overflow-hidden bg-background text-foreground">
    <Sidebar />
    <section className="relative flex min-w-0 flex-1 flex-col">
      <Toolbar onAi={() => setAiOpen(true)} onPlugins={() => setPluginsOpen(true)} />
      <div className="min-h-0 flex-1"><EditorWorkspace /></div>
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <PluginPanel open={pluginsOpen} onClose={() => setPluginsOpen(false)} />
    </section>
  </div>
}
