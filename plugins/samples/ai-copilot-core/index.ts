import type { AiActionInput, AiActionOutput } from '../../../src/shared/types'
import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

function words(text: string) {
  return text.split(/\s+/).filter(Boolean)
}

function modelBadge(input: AiActionInput) {
  return input.model ? `\n\n<!-- Model: ${input.provider?.name ?? input.model.providerId} / ${input.model.name} -->` : ''
}

export function summarize(input: AiActionInput): AiActionOutput {
  const text = input.text || input.document || ''
  const summary = words(text).slice(0, 70).join(' ')
  return { text: `${summary}${words(text).length > 70 ? '...' : ''}${modelBadge(input)}` }
}

export function tags(input: AiActionInput): AiActionOutput {
  const stop = new Set(['about', 'after', 'before', 'their', 'there', 'these', 'those', 'with', 'from', 'that', 'this', 'have'])
  const values = Array.from(new Set(words(input.text || input.document || '')
    .map((word) => word.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    .filter((word) => word.length > 4 && !stop.has(word))))
    .slice(0, 10)
  return { text: values.map((tag) => `#${tag}`).join(' '), tags: values }
}

export function rewrite(input: AiActionInput): AiActionOutput {
  const text = input.text || input.document || ''
  return { text: `${text.replace(/\butilize\b/gi, 'use').replace(/\bin order to\b/gi, 'to').replace(/\s{2,}/g, ' ').trim()}${modelBadge(input)}` }
}

export function outline(input: AiActionInput): AiActionOutput {
  const source = input.text || input.document || ''
  const headings = Array.from(source.matchAll(/^(#{1,6})\s+(.+)$/gm)).map((match) => `${'  '.repeat(match[1].length - 1)}- ${match[2].trim()}`)
  return { text: `${headings.length ? headings.join('\n') : '- Introduction\n- Main argument\n- Evidence\n- Next steps'}${modelBadge(input)}` }
}

export function critique(input: AiActionInput): AiActionOutput {
  const text = input.text || input.document || ''
  const checks = [
    { label: 'Has a clear title', pass: /^#\s+.+/m.test(text) },
    { label: 'Uses section headings', pass: /^##\s+.+/m.test(text) },
    { label: 'Includes links or references', pass: /\[[^\]]+\]\([^)]+\)|\[\[[^\]]+\]\]/.test(text) },
    { label: 'Keeps paragraphs scannable', pass: !text.split('\n\n').some((paragraph) => words(paragraph).length > 140) },
  ]
  return { text: checks.map((check) => `- [${check.pass ? 'x' : ' '}] ${check.label}`).join('\n') + modelBadge(input) }
}

export function continueDraft(input: AiActionInput): AiActionOutput {
  const prompt = input.prompt?.trim() || 'Continue from the current note.'
  return { text: `\n\n## Next draft\n\n${prompt}\n\n- Expand the strongest claim.\n- Add concrete examples.\n- Close with the next action.${modelBadge(input)}` }
}

const handlers: Record<string, (input: AiActionInput) => AiActionOutput> = {
  'copilot.summary': summarize,
  'copilot.tags': tags,
  'copilot.rewrite': rewrite,
  'copilot.outline': outline,
  'copilot.critique': critique,
  'copilot.continue': continueDraft,
}

export async function activate(api: LightPaperPluginApi) {
  api.ai.registerPreset('copilot.summary', 'Copilot: Summarize', async (input) => summarize(input))
  api.ai.registerPreset('copilot.tags', 'Copilot: Generate tags', async (input) => tags(input))
  api.ai.registerPreset('copilot.rewrite', 'Copilot: Rewrite sharper', async (input) => rewrite(input))
  api.ai.registerPreset('copilot.outline', 'Copilot: Outline', async (input) => outline(input))
  api.ai.registerPreset('copilot.critique', 'Copilot: Critique draft', async (input) => critique(input))
  api.ai.registerPreset('copilot.continue', 'Copilot: Continue draft', async (input) => continueDraft(input))

  api.commands.register('copilot.summarizeDocument', 'Copilot: Summarize Document', async (ctx) => ctx.insertText(`\n\n## Summary\n\n${summarize({ text: ctx.documentText || '' }).text}\n`))
  api.commands.register('copilot.generateTags', 'Copilot: Generate Tags', async (ctx) => ctx.insertText(`\n\n${tags({ text: ctx.documentText || '' }).text}\n`))
  api.commands.register('copilot.rewriteSelection', 'Copilot: Rewrite Selection', async (ctx) => ctx.replaceSelection(rewrite({ text: ctx.selectedText || ctx.documentText || '' }).text))
  api.commands.register('copilot.outlineDocument', 'Copilot: Outline Document', async (ctx) => ctx.insertText(`\n\n## Outline\n\n${outline({ text: ctx.documentText || '' }).text}\n`))
  api.commands.register('copilot.critiqueDraft', 'Copilot: Critique Draft', async (ctx) => ctx.insertText(`\n\n## Draft critique\n\n${critique({ text: ctx.documentText || '' }).text}\n`))
  api.commands.register('copilot.continueDraft', 'Copilot: Continue Draft', async (ctx) => ctx.insertText(continueDraft({ text: ctx.documentText || '' }).text))
}

export function runCopilotPreset(id: string, input: AiActionInput) {
  const handler = handlers[id]
  if (!handler) throw new Error(`Unknown copilot preset: ${id}`)
  return handler(input)
}
