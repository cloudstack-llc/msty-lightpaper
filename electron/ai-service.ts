import type { AiActionInput, AiActionOutput } from '../src/shared/types'
import type { SecretVault } from './secret-vault'

export type ResolvedAiProviderAuth = { type: 'none' } | { type: 'api-key' | 'bearer' | 'custom-header'; apiKeyRef: string; headerName?: string; secret: string }
export type ResolvedAiExecutionContext = { auth: ResolvedAiProviderAuth; providerId?: string; modelId?: string }

export function resolveAiProviderAuth(input: AiActionInput, vault: Pick<SecretVault, 'resolveProviderSecret'>): ResolvedAiProviderAuth {
  const auth = input.provider?.auth
  if (!auth || auth.type === 'none') return { type: 'none' }
  if (!auth.apiKeyRef) throw new Error('Provider auth requires an apiKeyRef')
  return { type: auth.type, apiKeyRef: auth.apiKeyRef, headerName: auth.headerName, secret: vault.resolveProviderSecret(auth.apiKeyRef) }
}

export function createResolvedAiExecutionContext(input: AiActionInput, vault: Pick<SecretVault, 'resolveProviderSecret'>): ResolvedAiExecutionContext {
  return { auth: resolveAiProviderAuth(input, vault), providerId: input.provider?.id, modelId: input.model?.id }
}

export async function runAiActionOffline(input: AiActionInput, _vault: Pick<SecretVault, 'resolveProviderSecret'>): Promise<AiActionOutput> {
  const text = input.text || input.document || ''
  const words = text.split(/\s+/).filter(Boolean)
  if (input.presetId === 'tags') return { text: '', tags: Array.from(new Set(words.filter((w) => w.length > 5).slice(0, 8).map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, '')))) }
  if (input.presetId === 'summary') return { text: words.slice(0, 80).join(' ') + (words.length > 80 ? '…' : '') }
  const model = input.model ? `\n\n<!-- Selected model: ${input.provider?.name ?? input.model.providerId} / ${input.model.name} -->` : ''
  return { text: `> AI draft placeholder\n\n${text}\n\n<!-- Configure an AI provider plugin to replace this offline stub. -->${model}` }
}
