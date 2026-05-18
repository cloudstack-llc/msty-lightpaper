import { useEffect, useState } from 'react'
import { AiPanel } from './components/AiPanel'
import { CommandPalette } from './components/CommandPalette'
import { EditorWorkspace } from './components/editor/EditorWorkspace'
import { PluginPanel } from './components/PluginPanel'
import { PluginThemeStyles } from './components/PluginThemeStyles'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { PluginDock } from './components/PluginDock'
import { applyThemeRuntime, themeOptions } from './lib/themes'
import { useAppStore } from './store/app-store'

export default function App() {
  const { hydrate, settings, pluginThemes } = useAppStore()
  const [aiOpen, setAiOpen] = useState(false)
  const [pluginsOpen, setPluginsOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (!settings) return
    applyThemeRuntime(document.documentElement, settings, themeOptions(pluginThemes))
  }, [pluginThemes, settings])
  return <>
    <PluginThemeStyles />
    <div data-lp-slot="workbench" className="flex h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && <Sidebar />}
      <section data-lp-slot="main-shell" className="relative flex min-w-0 flex-1 flex-col">
        <Toolbar onAi={() => setAiOpen(true)} onPlugins={() => setPluginsOpen(true)} onCommands={() => setCommandsOpen(true)} onSettings={() => setSettingsOpen(true)} onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
        <div data-lp-slot="workspace-row" className="flex min-h-0 flex-1">
          <div data-lp-slot="editor-stage" className="min-w-0 flex-1"><EditorWorkspace /></div>
          <PluginDock location="right" />
        </div>
        <PluginDock location="bottom" />
        <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
        <PluginPanel open={pluginsOpen} onClose={() => setPluginsOpen(false)} />
        <CommandPalette open={commandsOpen} onClose={() => setCommandsOpen(false)} />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </section>
    </div>
  </>
}
