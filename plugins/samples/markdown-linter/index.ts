import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

type Issue = { line: number; severity: 'warning' | 'info'; message: string }

export function lintMarkdown(text: string): Issue[] {
  const issues: Issue[] = []
  const seen = new Map<string, number>()
  let prev = 0
  text.split('\n').forEach((line, index) => {
    const lineNo = index + 1
    if (/\s+$/.test(line)) issues.push({ line: lineNo, severity: 'info', message: 'Trailing whitespace' })
    if (line.length > 120) issues.push({ line: lineNo, severity: 'info', message: 'Line exceeds 120 characters' })
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const title = heading[2].trim().toLowerCase()
      if (prev && level > prev + 1) issues.push({ line: lineNo, severity: 'warning', message: `Heading jumps from H${prev} to H${level}` })
      if (seen.has(title)) issues.push({ line: lineNo, severity: 'warning', message: `Duplicate heading also seen on line ${seen.get(title)}` })
      seen.set(title, lineNo)
      prev = level
    }
    if (/!\[\]\(/.test(line)) issues.push({ line: lineNo, severity: 'warning', message: 'Image is missing alt text' })
    if (/^[-*+]\S/.test(line)) issues.push({ line: lineNo, severity: 'warning', message: 'List marker should be followed by a space' })
  })
  return issues
}

export function formatIssues(issues: Issue[]) { return issues.length ? issues.map((issue) => `- L${issue.line} [${issue.severity}] ${issue.message}`).join('\n') : 'No Markdown lint issues found.' }
export function fixWhitespace(text: string) { return text.split('\n').map((line) => line.replace(/\s+$/g, '')).join('\n').replace(/\n{4,}/g, '\n\n\n') }

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('lint.currentDocument', 'Lint Current Markdown Document', (ctx) => ctx.showToast(formatIssues(lintMarkdown(ctx.documentText || ''))))
  api.commands.register('lint.fixWhitespace', 'Fix Markdown Whitespace', async (ctx) => { await ctx.replaceSelection(fixWhitespace(ctx.documentText || '')); ctx.showToast('Whitespace fixed') })
}
