import { Bot, FileSignature, KeyRound, Lock, Sparkles, Tags, Trash2, Wand2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import type { VaultStatus } from '@shared/types'

const presets = [
  { id: 'summary', label: 'Summarize note', icon: FileSignature, prompt: 'Summarize this note with crisp bullets.' },
  { id: 'tags', label: 'Generate tags', icon: Tags, prompt: 'Extract useful tags.' },
  { id: 'rewrite', label: 'Rewrite sharper', icon: Wand2, prompt: 'Rewrite this markdown to be clearer, more vivid, and more concise.' },
]

export function AiPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const { content, setContent, activeFile, pluginAiPresets, pluginAiProviders, settings, updateSettings, runAiAction } = useAppStore()
  const [result, setResult] = useState('')
  const [prompt, setPrompt] = useState('Make this better without losing my voice.')
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>({ exists: false, unlocked: false, secretCount: 0 })
  const [masterPassword, setMasterPassword] = useState('')
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({})
  const [configuredRefs, setConfiguredRefs] = useState<string[]>([])
  const [vaultError, setVaultError] = useState('')
  const models = pluginAiProviders.flatMap((provider) => provider.models.map((model) => ({ ...model, providerName: provider.name })))
  const providerSecretRefs = useMemo(() => Array.from(new Set(pluginAiProviders.map((provider) => provider.auth.apiKeyRef).filter((ref): ref is string => Boolean(ref)))).sort(), [pluginAiProviders])
  const selectedModelId = settings?.selectedAiModelId || models[0]?.id || ''
  async function refreshVault() {
    const status = await window.lightpaper.vaultStatus() as VaultStatus
    setVaultStatus(status)
    if (status.error) {
      setConfiguredRefs([])
      setVaultError(status.error)
      return
    }
    const refs = await window.lightpaper.listSecretRefs() as string[]
    setConfiguredRefs(refs)
    setVaultError('')
  }
  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => {
      void refreshVault().catch((error) => setVaultError(error instanceof Error ? error.message : String(error)))
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [open])
  async function submitVaultPassword() {
    setVaultError('')
    try {
      const status = vaultStatus.exists
        ? await window.lightpaper.unlockVault(masterPassword) as VaultStatus
        : await window.lightpaper.createVault(masterPassword) as VaultStatus
      setVaultStatus(status)
      setMasterPassword('')
      await refreshVault()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setVaultError(message.includes('Invalid master password') ? 'Unable to unlock vault. Check the master password.' : message)
    }
  }
  async function lockVault() {
    setVaultError('')
    try {
      const status = await window.lightpaper.lockVault() as VaultStatus
      setVaultStatus(status)
      setSecretDrafts({})
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : String(error))
    }
  }
  async function saveSecret(apiKeyRef: string) {
    setVaultError('')
    try {
      await window.lightpaper.setProviderSecret(apiKeyRef, secretDrafts[apiKeyRef] ?? '')
      setSecretDrafts((drafts) => ({ ...drafts, [apiKeyRef]: '' }))
      await refreshVault()
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : String(error))
    }
  }
  async function removeSecret(apiKeyRef: string) {
    setVaultError('')
    try {
      await window.lightpaper.deleteProviderSecret(apiKeyRef)
      await refreshVault()
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : String(error))
    }
  }
  if (!open) return null
  async function run(presetId?: string) {
    const output = await runAiAction({ presetId, prompt, text: content, document: content, path: activeFile })
    setResult(output.tags?.length ? output.tags.map((t: string) => `#${t}`).join(' ') : output.text)
  }
  return <div className="absolute bottom-4 right-4 top-16 z-20 flex w-[420px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/40">
    <div className="shrink-0 flex items-center justify-between border-b p-4"><div><div className="flex items-center gap-2 font-semibold"><Bot className="h-4 w-4 text-accent" /> LightPaper AI Lab</div><p className="text-xs text-muted-foreground">Offline stub now, provider plugins later.</p></div><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></div>
    <div className="titlebar-no-drag min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
      {models.length > 0 && <label className="block space-y-2 rounded-xl border bg-background p-3 text-xs">
        <span className="font-medium text-foreground">Model</span>
        <select aria-label="Model" className="w-full rounded-lg border bg-card px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary" value={selectedModelId} onChange={(event) => updateSettings({ selectedAiModelId: event.target.value, aiProvider: 'custom-plugin', aiModel: event.target.value })}>
          {models.map((model) => <option key={model.id} value={model.id}>{model.providerName} / {model.name}</option>)}
        </select>
        {selectedModelId && <span className="block text-[11px] text-muted-foreground">{models.find((model) => model.id === selectedModelId)?.capabilities.join(', ')}</span>}
      </label>}
      {providerSecretRefs.length > 0 && <section className="space-y-3 rounded-xl border bg-background p-3 text-xs">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-medium text-foreground"><KeyRound className="h-4 w-4 text-primary" />Provider API keys</div><p className="mt-1 text-[11px] text-muted-foreground">Encrypted local vault. No password recovery; lost passwords make stored keys unrecoverable.</p></div>{vaultStatus.unlocked && <button type="button" className="rounded-lg border px-2 py-1 hover:bg-muted" onClick={lockVault}><Lock className="mr-1 inline h-3 w-3" />Lock</button>}</div>
        {!vaultStatus.unlocked && <div className="flex gap-2"><input aria-label="Vault master password" className="min-w-0 flex-1 rounded-lg border bg-card px-2 py-2 outline-none focus:ring-2 focus:ring-primary" type="password" placeholder={vaultStatus.exists ? 'Master password' : 'Create master password'} value={masterPassword} onChange={(event) => setMasterPassword(event.target.value)} /><button type="button" className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={submitVaultPassword}>{vaultStatus.exists ? 'Unlock' : 'Create'}</button></div>}
        {vaultError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">{vaultError}</div>}
        <div className="space-y-2">{providerSecretRefs.map((apiKeyRef) => {
          const hasSecret = configuredRefs.includes(apiKeyRef)
          return <div key={apiKeyRef} className="space-y-2 rounded-lg border bg-card p-2"><div className="flex items-center justify-between gap-2"><code className="truncate text-[10px] text-muted-foreground">{apiKeyRef}</code><span className={hasSecret ? 'text-[11px] text-emerald-400' : 'text-[11px] text-amber-400'}>{hasSecret ? 'configured' : 'missing'}</span></div>{vaultStatus.unlocked && <div className="flex gap-2"><input aria-label={`Secret for ${apiKeyRef}`} className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-2 outline-none focus:ring-2 focus:ring-primary" type="password" placeholder={hasSecret ? 'New key to update' : 'API key'} value={secretDrafts[apiKeyRef] ?? ''} onChange={(event) => setSecretDrafts((drafts) => ({ ...drafts, [apiKeyRef]: event.target.value }))} /><button type="button" className="rounded-lg border px-2 py-1 hover:bg-muted" onClick={() => saveSecret(apiKeyRef)}>Save</button>{hasSecret && <button aria-label={`Remove ${apiKeyRef}`} type="button" className="rounded-lg border px-2 py-1 hover:bg-muted" onClick={() => removeSecret(apiKeyRef)}><Trash2 className="h-3.5 w-3.5" /></button>}</div>}</div>
        })}</div>
      </section>}
      <div className="grid grid-cols-3 gap-2">{presets.map((p) => <button type="button" key={p.id} className="rounded-xl border bg-background p-3 text-left text-xs hover:border-primary" onClick={() => run(p.id)}><p.icon className="mb-2 h-4 w-4 text-primary" />{p.label}</button>)}</div>
      {pluginAiPresets.length > 0 && <div className="grid grid-cols-2 gap-2">{pluginAiPresets.map((preset) => <button type="button" key={`${preset.pluginId}:${preset.id}`} className="rounded-xl border bg-background p-3 text-left text-xs hover:border-accent" onClick={() => run(preset.id)}><Sparkles className="mb-2 h-4 w-4 text-accent" />{preset.label}<span className="mt-1 block truncate text-[10px] text-muted-foreground">{preset.pluginName}</span></button>)}</div>}
      <textarea className="h-24 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="flex gap-2"><button type="button" className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => run()}><Sparkles className="mr-1.5 inline h-4 w-4" />Run custom prompt</button><button type="button" className="rounded-xl border px-3 py-2 text-sm hover:bg-muted" onClick={() => result && setContent(result)}>Replace document</button></div>
      {result && <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border bg-background p-3 text-xs text-muted-foreground">{result}</pre>}
    </div>
  </div>
}
