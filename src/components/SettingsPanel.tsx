import { Settings, Type, X } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function SettingsPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const { settings, updateSettings } = useAppStore()
  if (!open || !settings) return null

  return <div className="absolute right-4 top-16 z-20 w-[360px] overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/40">
    <div className="flex items-center justify-between border-b p-4">
      <div>
        <div className="flex items-center gap-2 font-semibold"><Settings className="h-4 w-4 text-primary" /> Settings</div>
        <p className="text-xs text-muted-foreground">Small knobs. Large consequences.</p>
      </div>
      <button className="rounded-md p-1 hover:bg-muted" onClick={onClose}><X className="h-4 w-4" /></button>
    </div>
    <div className="space-y-4 p-4">
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
      <button className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-muted" onClick={() => updateSettings({ splitRatio: 50 })}>Reset split to 50/50</button>
    </div>
  </div>
}
