import type { AiActionInput, AiActionOutput } from '../../../src/shared/types'
import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

export function offlineRewrite(input: AiActionInput, mode: 'clarify' | 'concise' | 'titles'): AiActionOutput {
  const text = input.text || input.document || ''
  if (mode === 'titles') {
    const subject = text.match(/^#\s+(.+)$/m)?.[1] || text.split(/\s+/).slice(0, 6).join(' ') || 'Untitled'
    return { text: [`${subject}: A Practical Guide`, `Notes on ${subject}`, `The ${subject} Playbook`, `${subject}, Clearly`, `Understanding ${subject}`].map((title) => `- ${title}`).join('\n') }
  }
  if (mode === 'concise') return { text: text.split(/\s+/).filter(Boolean).slice(0, Math.ceil(text.split(/\s+/).length * 0.65)).join(' ') }
  return { text: text.replace(/\butilize\b/gi, 'use').replace(/\bin order to\b/gi, 'to').replace(/\bvery\b/gi, '').replace(/\s{2,}/g, ' ').trim() }
}

export async function activate(api: LightPaperPluginApi) {
  api.ai.registerPreset('clarify', 'Improve clarity', async (input) => offlineRewrite(input, 'clarify'))
  api.ai.registerPreset('concise', 'Make concise', async (input) => offlineRewrite(input, 'concise'))
  api.ai.registerPreset('titles', 'Generate title options', async (input) => offlineRewrite(input, 'titles'))
  api.commands.register('aiRewrite.clarify', 'AI: Improve Clarity', async (ctx) => ctx.replaceSelection(offlineRewrite({ text: ctx.selectedText || ctx.documentText || '' }, 'clarify').text))
  api.commands.register('aiRewrite.makeConcise', 'AI: Make Concise', async (ctx) => ctx.replaceSelection(offlineRewrite({ text: ctx.selectedText || ctx.documentText || '' }, 'concise').text))
  api.commands.register('aiRewrite.titleOptions', 'AI: Generate Title Options', async (ctx) => ctx.insertText(`\n\n## Title options\n\n${offlineRewrite({ document: ctx.documentText || '', text: '' }, 'titles').text}\n`))
}
