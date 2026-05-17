import type { AiActionInput, AiActionOutput, PluginRecord } from '@shared/types'
import type { LightPaperCommandContext } from '@shared/plugin-api'
import { bundledPluginModules } from './bundled-plugin-modules'
import { PluginHost } from './plugin-host'

export const bundledPluginHost = new PluginHost({ modules: bundledPluginModules })

export async function activateBundledPlugins(plugins: PluginRecord[]) {
  await bundledPluginHost.activatePlugins(plugins)
}

export async function ensureBundledPluginsActivated(plugins: PluginRecord[]) {
  await activateBundledPlugins(plugins)
}

export function listPluginCommands() {
  return bundledPluginHost.listCommands()
}

export function getPluginCommand(id: string) {
  return bundledPluginHost.getCommand(id)
}

export function listPluginAiPresets() {
  return bundledPluginHost.listAiPresets()
}

export function getPluginAiPreset(id: string) {
  return bundledPluginHost.getAiPreset(id)
}

export async function executePluginCommand(id: string, context: LightPaperCommandContext) {
  return bundledPluginHost.executeCommand(id, context)
}

export async function runPluginAiPreset(id: string, input: AiActionInput): Promise<AiActionOutput> {
  return bundledPluginHost.runAiPreset(id, input)
}

export function listMarkdownExtensions() {
  return bundledPluginHost.listMarkdownExtensions()
}

export function listPluginPanels() {
  return bundledPluginHost.listPanels()
}

export function listPluginActivationErrors() {
  return bundledPluginHost.errors
}

export type RegisteredCommand = ReturnType<typeof listPluginCommands>[number]
export type RegisteredAiPreset = ReturnType<typeof listPluginAiPresets>[number]
