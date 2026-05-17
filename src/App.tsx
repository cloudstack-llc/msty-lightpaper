import { useEffect, useState } from 'react'
import { AiPanel } from './components/AiPanel'
import { CommandPalette } from './components/CommandPalette'
import { EditorWorkspace } from './components/editor/EditorWorkspace'
import { PluginPanel } from './components/PluginPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { useAppStore } from './store/app-store'

export default function App() {
  const { hydrate, settings } = useAppStore()
  const [aiOpen, setAiOpen] = useState(false)
  const [pluginsOpen, setPluginsOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    document.documentElement.className = `theme-${settings?.theme ?? 'obsidian'} dark`
  }, [settings?.theme])
  return <div className="flex h-screen overflow-hidden bg-background text-foreground">
    {sidebarOpen && <Sidebar />}
    <section className="relative flex min-w-0 flex-1 flex-col">
      <Toolbar onAi={() => setAiOpen(true)} onPlugins={() => setPluginsOpen(true)} onCommands={() => setCommandsOpen(true)} onSettings={() => setSettingsOpen(true)} onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      <div className="min-h-0 flex-1"><EditorWorkspace /></div>
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <PluginPanel open={pluginsOpen} onClose={() => setPluginsOpen(false)} />
      <CommandPalette open={commandsOpen} onClose={() => setCommandsOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </section>
  </div>
}
