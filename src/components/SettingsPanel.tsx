import { Check, LayoutPanelTop, Palette, Settings, SlidersHorizontal, Type, X } from 'lucide-react'
import type { ThemeId, ThemeSettingContribution, ThemeSettingValue } from '@shared/types'
import { findThemeOption, themeClassName, themeOptions, themeSettingValue, type ThemeOption } from '@/lib/themes'
import { useAppStore } from '@/store/app-store'

function ThemeCard({ active, theme, onSelect }: { active: boolean; theme: ThemeOption; onSelect(): void }) {
  return (
    <button type="button" className={`group overflow-hidden rounded-xl border text-left transition hover:border-primary/70 hover:bg-muted/45 ${active ? 'border-primary bg-primary/10' : 'bg-background'}`} onClick={onSelect}>
      <div className={`${themeClassName(theme.id)} border-b bg-background p-2 text-foreground`}>
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="h-2.5 w-8 rounded-full bg-muted" />
          </div>
          <div className="mb-1 h-2 w-3/4 rounded bg-foreground/80" />
          <div className="mb-2 h-1.5 w-1/2 rounded bg-muted-foreground/55" />
          <div className="rounded border bg-background p-1">
            <div className="h-1.5 w-full rounded bg-primary/60" />
          </div>
        </div>
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{theme.label}</span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{theme.source === 'plugin' ? theme.pluginName : 'Built-in'}</span>
          {theme.inspiration && <span className="mt-1 block truncate text-[11px] text-muted-foreground">{theme.inspiration}</span>}
        </span>
        {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
      </div>
    </button>
  )
}

function SettingControl({ setting, value, onChange }: { setting: ThemeSettingContribution; value: ThemeSettingValue; onChange(value: ThemeSettingValue): void }) {
  if (setting.type === 'toggle') {
    return (
      <label className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium">{setting.label}</span>
          {setting.description && <span className="mt-0.5 block text-xs text-muted-foreground">{setting.description}</span>}
        </span>
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      </label>
    )
  }

  if (setting.type === 'range') {
    return (
      <label className="block rounded-xl border bg-background p-3">
        <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
          {setting.label}
          <span className="font-mono text-xs text-muted-foreground">{String(value)}</span>
        </span>
        <input className="w-full" type="range" min={setting.min} max={setting.max} step={setting.step ?? 1} value={Number(value)} onChange={(event) => onChange(Number(event.target.value))} />
        {setting.description && <span className="mt-1 block text-xs text-muted-foreground">{setting.description}</span>}
      </label>
    )
  }

  return (
    <label className="block rounded-xl border bg-background p-3">
      <span className="mb-2 block text-sm font-medium">{setting.label}</span>
      <select className="w-full rounded-lg border bg-card px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" value={String(value)} onChange={(event) => onChange(event.target.value)}>
        {setting.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {setting.description && <span className="mt-1 block text-xs text-muted-foreground">{setting.description}</span>}
    </label>
  )
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const { settings, updateSettings, pluginThemes } = useAppStore()
  if (!open || !settings) return null
  const themes = themeOptions(pluginThemes)
  const activeTheme = findThemeOption(settings.theme, themes)
  const activeLayoutModes = [{ id: 'standard', label: 'Standard', description: 'Default LightPaper shell.' }, ...(activeTheme.layoutModes ?? [])]
  const setThemeSetting = (setting: ThemeSettingContribution, value: ThemeSettingValue) => {
    void updateSettings({
      themeSettings: {
        ...(settings.themeSettings ?? {}),
        [activeTheme.id]: {
          ...(settings.themeSettings?.[activeTheme.id] ?? {}),
          [setting.id]: value,
        },
      },
    })
  }

  return <div className="absolute bottom-4 right-4 top-16 z-20 flex w-[560px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/40">
    <div className="shrink-0 flex items-center justify-between border-b p-4">
      <div>
        <div className="flex items-center gap-2 font-semibold"><Settings className="h-4 w-4 text-primary" /> Settings</div>
        <p className="text-xs text-muted-foreground">Small knobs. Large consequences.</p>
      </div>
      <button type="button" className="rounded-md p-1 hover:bg-muted" onClick={onClose}><X className="h-4 w-4" /></button>
    </div>
    <div className="titlebar-no-drag min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium"><Palette className="h-4 w-4" /> Theme</span>
          <span className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">{themes.length} available</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => (
            <ThemeCard key={`${theme.source}:${theme.id}`} theme={theme} active={settings.theme === theme.id} onSelect={() => void updateSettings({ theme: theme.id as ThemeId })} />
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium"><LayoutPanelTop className="h-4 w-4" /> Layout mode</span>
          <span className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">{activeTheme.label}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {activeLayoutModes.map((mode) => (
            <button type="button" key={mode.id} className={`rounded-xl border p-3 text-left transition hover:border-primary/70 hover:bg-muted/45 ${settings.layoutMode === mode.id ? 'border-primary bg-primary/10' : 'bg-background'}`} onClick={() => void updateSettings({ layoutMode: mode.id })}>
              <span className="flex items-center justify-between gap-2 text-sm font-semibold">{mode.label}{settings.layoutMode === mode.id && <Check className="h-4 w-4 text-primary" />}</span>
              {mode.description && <span className="mt-1 block text-xs text-muted-foreground">{mode.description}</span>}
            </button>
          ))}
        </div>
      </section>
      {(activeTheme.settings?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <span className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="h-4 w-4" /> Theme controls</span>
          <div className="grid gap-3">
            {activeTheme.settings?.map((setting) => (
              <SettingControl key={setting.id} setting={setting} value={themeSettingValue(settings, activeTheme, setting)} onChange={(value) => setThemeSetting(setting, value)} />
            ))}
          </div>
        </section>
      )}
      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-medium"><Type className="h-4 w-4" /> Editor font</span>
        <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value as typeof settings.fontFamily })}>
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
      </label>
      <label className="flex items-center justify-between rounded-xl border bg-background p-3 text-sm">
        <span>
          <span className="block font-medium">Sync split scrolling</span>
          <span className="text-xs text-muted-foreground">Preview follows editor scroll.</span>
        </span>
        <input type="checkbox" checked={settings.syncScroll} onChange={(e) => updateSettings({ syncScroll: e.target.checked })} />
      </label>
      <button type="button" className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-muted" onClick={() => updateSettings({ splitRatio: 50 })}>Reset split to 50/50</button>
    </div>
  </div>
}
