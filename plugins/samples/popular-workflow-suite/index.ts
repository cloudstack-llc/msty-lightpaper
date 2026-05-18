import type { LightPaperCommandContext, LightPaperPluginApi, LightPaperPluginModule } from '../../../src/shared/plugin-api'

type CommandSpec = {
  id: string
  title: string
  run(ctx: LightPaperCommandContext): unknown | Promise<unknown>
}

function words(text: string) {
  return text.split(/\s+/).filter(Boolean)
}

function titleFrom(markdown: string) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled'
}

function headings(markdown: string) {
  return Array.from(markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)).map((match) => ({ level: match[1].length, text: match[2].trim() }))
}

function tags(markdown: string) {
  return Array.from(new Set(Array.from(markdown.matchAll(/(^|\s)#([A-Za-z][\w-]+)/g)).map((match) => match[2].toLowerCase()))).sort()
}

function links(markdown: string) {
  return Array.from(markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)).map((match) => ({
    label: match[1] || match[4] || match[3] || '',
    target: match[2] || match[3] || '',
  }))
}

function tasks(markdown: string) {
  return Array.from(markdown.matchAll(/^\s*[-*]\s+\[([ xX/-])\]\s+(.+)$/gm)).map((match) => ({
    done: match[1].toLowerCase() === 'x',
    status: match[1],
    text: match[2].trim(),
    due: match[2].match(/(?:due|@due)\s*:?\s*(\d{4}-\d{2}-\d{2})/i)?.[1],
  }))
}

function checksum(text: string) {
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function canvasFlow(markdown: string) {
  const nodes = headings(markdown).slice(0, 8)
  const labels = nodes.length ? nodes.map((node) => node.text) : words(markdown).slice(0, 6)
  const safe = labels.map((label, index) => ({ id: `N${index + 1}`, label: label.replace(/["[\]]/g, '') || `Step ${index + 1}` }))
  return ['```mermaid', 'flowchart TD', ...safe.map((node) => `  ${node.id}["${node.label}"]`), ...safe.slice(1).map((node, index) => `  ${safe[index].id} --> ${node.id}`), '```'].join('\n')
}

export function renderDynamicTemplate(template: string, ctx: { title?: string; selection?: string; date?: Date } = {}) {
  const date = ctx.date ?? new Date()
  return template
    .replaceAll('{{date}}', isoDate(date))
    .replaceAll('{{time}}', date.toISOString().slice(11, 16))
    .replaceAll('{{title}}', ctx.title || 'Untitled')
    .replaceAll('{{selection}}', ctx.selection || '')
}

export function queryLensReport(markdown: string) {
  const noteTasks = tasks(markdown)
  const noteLinks = links(markdown)
  const noteHeadings = headings(markdown)
  return [
    '## Query Lens Report',
    '',
    `- Title: ${titleFrom(markdown)}`,
    `- Words: ${words(markdown).length}`,
    `- Headings: ${noteHeadings.length}`,
    `- Open tasks: ${noteTasks.filter((task) => !task.done).length}`,
    `- Done tasks: ${noteTasks.filter((task) => task.done).length}`,
    `- Tags: ${tags(markdown).map((tag) => `#${tag}`).join(', ') || 'none'}`,
    `- Links: ${noteLinks.map((link) => link.target).join(', ') || 'none'}`,
  ].join('\n')
}

export function taskflowReport(markdown: string) {
  const noteTasks = tasks(markdown)
  const dated = noteTasks.filter((task) => task.due)
  return [
    '## Taskflow Dashboard',
    '',
    `- Total tasks: ${noteTasks.length}`,
    `- Open: ${noteTasks.filter((task) => !task.done).length}`,
    `- Complete: ${noteTasks.filter((task) => task.done).length}`,
    `- With due dates: ${dated.length}`,
    '',
    ...noteTasks.filter((task) => !task.done).slice(0, 8).map((task) => `- [ ] ${task.text}`),
  ].join('\n')
}

export function monthGrid(date = new Date()) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const rows: string[][] = []
  let week = Array(first.getUTCDay()).fill('')
  for (let day = 1; day <= days; day += 1) {
    week.push(`[[${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}|${day}]]`)
    if (week.length === 7) {
      rows.push(week)
      week = []
    }
  }
  if (week.length) rows.push([...week, ...Array(7 - week.length).fill('')])
  return ['| Sun | Mon | Tue | Wed | Thu | Fri | Sat |', '| --- | --- | --- | --- | --- | --- | --- |', ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n')
}

export function versionSnapshot(markdown: string) {
  return [
    '## Version Ledger Snapshot',
    '',
    `- Captured: ${new Date().toISOString()}`,
    `- Title: ${titleFrom(markdown)}`,
    `- Words: ${words(markdown).length}`,
    `- Checksum: ${checksum(markdown)}`,
    '',
    '### Change notes',
    '',
    '- Added:',
    '- Changed:',
    '- Follow-up:',
  ].join('\n')
}

export function boardFromTasks(markdown: string) {
  const open = tasks(markdown).filter((task) => !task.done)
  return [
    '## Board Stacks',
    '',
    '### Backlog',
    '',
    ...open.slice(0, 6).map((task) => `- [ ] ${task.text}`),
    '',
    '### Doing',
    '',
    '- [ ] ',
    '',
    '### Done',
    '',
    ...tasks(markdown).filter((task) => task.done).slice(0, 6).map((task) => `- [x] ${task.text}`),
  ].join('\n')
}

export function symbolLegend(markdown: string) {
  return ['## Symbol Library', '', ...headings(markdown).map((heading) => `- [h${heading.level}] ${heading.text}`), '- [idea] Idea', '- [risk] Risk', '- [decision] Decision'].join('\n')
}

export function syncManifest(markdown: string, path = 'current-note.md') {
  return ['```json', JSON.stringify({ path, checksum: checksum(markdown), words: words(markdown).length, capturedAt: new Date().toISOString(), strategy: 'manual portable backup' }, null, 2), '```'].join('\n')
}

export function quickCapture(text: string) {
  const value = text.trim() || 'New capture'
  return `\n## Inbox Capture - ${isoDate()}\n\n- [ ] ${value}\n`
}

export function styleTokenGuide() {
  return ['## Style Studio Tokens', '', '- `--primary`: active command and link accent', '- `--accent`: secondary highlight', '- `--preview-measure`: reading width', '- `--preview-leading`: preview line height', '- `--editor-font-family`: editor surface font'].join('\n')
}

export function ribbonFormat(text: string, mode: 'bold' | 'code' | 'callout') {
  const value = text.trim() || 'Text'
  if (mode === 'code') return `\`\`\`ts\n${value}\n\`\`\``
  if (mode === 'callout') return `> [!NOTE] Note\n> ${value}`
  return `**${value}**`
}

export function deepIndex(markdown: string) {
  return [
    '## Deep Index',
    '',
    '### Headings',
    ...headings(markdown).map((heading) => `- ${'  '.repeat(heading.level - 1)}${heading.text}`),
    '',
    '### Tags',
    tags(markdown).map((tag) => `- #${tag}`).join('\n') || '- none',
    '',
    '### Links',
    links(markdown).map((link) => `- ${link.label} -> ${link.target}`).join('\n') || '- none',
  ].join('\n')
}

export function importBridgeMarkdown(input: string) {
  return input
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function outlineForge(markdown: string) {
  const lines = headings(markdown).map((heading) => `${'  '.repeat(heading.level - 1)}- ${heading.text}`)
  return ['## Outline Forge', '', ...(lines.length ? lines : ['- Start', '  - Detail', '  - Evidence'])].join('\n')
}

export function launchpad(markdown: string) {
  return [
    '# Launchpad',
    '',
    '## Continue',
    '',
    `- [[${titleFrom(markdown)}]]`,
    '',
    '## Open Tasks',
    '',
    ...tasks(markdown).filter((task) => !task.done).slice(0, 8).map((task) => `- [ ] ${task.text}`),
    '',
    '## Links',
    '',
    ...links(markdown).slice(0, 8).map((link) => `- [[${link.target}]]`),
  ].join('\n')
}

export function recentTrail(path = 'current-note.md') {
  return `- ${new Date().toISOString()} - ${path}`
}

function moduleFromCommands(commands: CommandSpec[]): LightPaperPluginModule {
  return {
    activate(api: LightPaperPluginApi) {
      for (const command of commands) api.commands.register(command.id, command.title, command.run)
    },
  }
}

export const popularWorkflowModules: Record<string, LightPaperPluginModule> = {
  'lightpaper.canvas-sketchbook': moduleFromCommands([
    { id: 'canvasSketch.insertFlowMap', title: 'Insert Canvas Flow Map', run: (ctx) => ctx.insertText(`\n\n${canvasFlow(ctx.documentText || '')}\n`) },
    { id: 'canvasSketch.insertDecisionFrame', title: 'Insert Visual Decision Frame', run: (ctx) => ctx.insertText('\n\n## Decision Frame\n\n```mermaid\nflowchart LR\n  Context --> Options --> Decision --> Followup\n```\n') },
  ]),
  'lightpaper.dynamic-template-lab': moduleFromCommands([
    { id: 'dynamicTemplate.renderDailyPlan', title: 'Render Dynamic Daily Plan', run: (ctx) => ctx.insertText(renderDynamicTemplate('# {{date}}\n\n## Focus\n\n{{selection}}\n\n## Log\n\n- {{time}} - \n', { title: titleFrom(ctx.documentText || ''), selection: ctx.selectedText })) },
    { id: 'dynamicTemplate.renderProjectNote', title: 'Render Dynamic Project Note', run: (ctx) => ctx.insertText(renderDynamicTemplate('# {{title}}\n\nCreated: {{date}}\n\n## Context\n\n{{selection}}\n\n## Next Actions\n\n- [ ] \n', { title: titleFrom(ctx.documentText || ''), selection: ctx.selectedText })) },
  ]),
  'lightpaper.query-lens': moduleFromCommands([
    { id: 'queryLens.insertReport', title: 'Insert Query Lens Report', run: (ctx) => ctx.insertText(`\n\n${queryLensReport(ctx.documentText || '')}\n`) },
  ]),
  'lightpaper.taskflow-planner': moduleFromCommands([
    { id: 'taskflow.insertDashboard', title: 'Insert Taskflow Dashboard', run: (ctx) => ctx.insertText(`\n\n${taskflowReport(ctx.documentText || '')}\n`) },
    { id: 'taskflow.insertRecurringTask', title: 'Insert Recurring Task Template', run: (ctx) => ctx.insertText('\n- [ ] Task title due: YYYY-MM-DD every: week\n') },
  ]),
  'lightpaper.journal-grid': moduleFromCommands([
    { id: 'journalGrid.insertMonth', title: 'Insert Month Grid', run: (ctx) => ctx.insertText(`\n\n${monthGrid()}\n`) },
    { id: 'journalGrid.insertTodayLink', title: 'Insert Today Link', run: (ctx) => ctx.insertText(`[[${isoDate()}]]`) },
  ]),
  'lightpaper.version-ledger': moduleFromCommands([
    { id: 'versionLedger.insertSnapshot', title: 'Insert Version Snapshot', run: (ctx) => ctx.insertText(`\n\n${versionSnapshot(ctx.documentText || '')}\n`) },
  ]),
  'lightpaper.board-stacks': moduleFromCommands([
    { id: 'boardStacks.fromTasks', title: 'Create Board From Tasks', run: (ctx) => ctx.insertText(`\n\n${boardFromTasks(ctx.documentText || '')}\n`) },
  ]),
  'lightpaper.symbol-library': moduleFromCommands([
    { id: 'symbolLibrary.insertLegend', title: 'Insert Symbol Legend', run: (ctx) => ctx.insertText(`\n\n${symbolLegend(ctx.documentText || '')}\n`) },
  ]),
  'lightpaper.sync-briefcase': moduleFromCommands([
    { id: 'syncBriefcase.insertManifest', title: 'Insert Portable Sync Manifest', run: (ctx) => ctx.insertText(`\n\n${syncManifest(ctx.documentText || '', ctx.activeFile)}\n`) },
    { id: 'syncBriefcase.insertConflictChecklist', title: 'Insert Sync Conflict Checklist', run: (ctx) => ctx.insertText('\n## Sync Conflict Checklist\n\n- [ ] Compare checksum\n- [ ] Keep newest meaningful edit\n- [ ] Archive losing copy\n') },
  ]),
  'lightpaper.quick-capture': moduleFromCommands([
    { id: 'quickCapture.toInbox', title: 'Capture Selection to Inbox', run: (ctx) => ctx.insertText(quickCapture(ctx.selectedText || ctx.documentText || '')) },
  ]),
  'lightpaper.style-studio': moduleFromCommands([
    { id: 'styleStudio.insertTokenGuide', title: 'Insert Style Token Guide', run: (ctx) => ctx.insertText(`\n\n${styleTokenGuide()}\n`) },
  ]),
  'lightpaper.format-ribbon': moduleFromCommands([
    { id: 'formatRibbon.boldSelection', title: 'Ribbon: Bold Selection', run: (ctx) => ctx.replaceSelection(ribbonFormat(ctx.selectedText || ctx.documentText || '', 'bold')) },
    { id: 'formatRibbon.codeFence', title: 'Ribbon: Code Fence', run: (ctx) => ctx.replaceSelection(ribbonFormat(ctx.selectedText || '', 'code')) },
    { id: 'formatRibbon.callout', title: 'Ribbon: Callout', run: (ctx) => ctx.replaceSelection(ribbonFormat(ctx.selectedText || '', 'callout')) },
  ]),
  'lightpaper.deep-index-search': moduleFromCommands([
    { id: 'deepIndex.insertSearchIndex', title: 'Insert Deep Search Index', run: (ctx) => ctx.insertText(`\n\n${deepIndex(ctx.documentText || '')}\n`) },
  ]),
  'lightpaper.import-bridge': moduleFromCommands([
    { id: 'importBridge.cleanPaste', title: 'Clean Imported HTML Paste', run: (ctx) => ctx.replaceSelection(importBridgeMarkdown(ctx.selectedText || ctx.documentText || '')) },
  ]),
  'lightpaper.outline-forge': moduleFromCommands([
    { id: 'outlineForge.insertOutline', title: 'Insert Structured Outline', run: (ctx) => ctx.insertText(`\n\n${outlineForge(ctx.documentText || '')}\n`) },
  ]),
  'lightpaper.launchpad-home': moduleFromCommands([
    { id: 'launchpad.insertHome', title: 'Insert Workspace Launchpad', run: (ctx) => ctx.replaceSelection(launchpad(ctx.documentText || '')) },
  ]),
  'lightpaper.recent-trail': moduleFromCommands([
    { id: 'recentTrail.recordCurrent', title: 'Record Current Note Trail', run: async (ctx) => { const entry = recentTrail(ctx.activeFile); if (ctx.activeFile) await ctx.insertText(`\n${entry}`); ctx.showToast(entry) } },
  ]),
  'lightpaper.theme-gallery': { activate() {} },
}
