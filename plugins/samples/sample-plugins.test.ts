import { describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { AppSettings } from '../../src/shared/types'
import { samplePlugins } from '../../electron/bundled-plugins'
import { bundledPluginModules } from '../../src/lib/bundled-plugin-modules'
import { PluginHost } from '../../src/lib/plugin-host'
import { validatePluginManifest } from '../../src/lib/plugin-manifest'
import { offlineRewrite } from './ai-rewrite-toolkit'
import { critique, rewrite, runCopilotPreset } from './ai-copilot-core'
import { extractWikiLinks, remarkWikiLinks } from './backlinks-wikilinks'
import { todayTemplate, weeklyTemplate } from './daily-notes'
import { markdownToPlainText, markdownToSimpleHtml, staticPage } from './export-pack'
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter-manager'
import { checkLinks, extractLinks } from './link-checker'
import { markdownPowerReport, normalizeMarkdownPowerPack } from './markdown-power-pack'
import { cardsDemo, imageGridDemo, styleGuideNote } from './minimal-workspace'
import { fixWhitespace, formatIssues, lintMarkdown } from './markdown-linter'
import { formatModelCatalog, providerCatalog } from './model-provider-catalog'
import { publishingBrief, staticHtmlExportBlock } from './publisher-kit'
import { auditPublishingReadiness, checklistMarkdown } from './publishing-seo-checklist'
import { delimitedToMarkdownTable, formatMarkdownTable } from './table-formatter'
import { boardFromTasks, canvasFlow, deepIndex, importBridgeMarkdown, launchpad, monthGrid, outlineForge, queryLensReport, ribbonFormat, syncManifest, taskflowReport, versionSnapshot } from './popular-workflow-suite'

describe('sample plugin catalog', () => {
  it('ships valid manifests for every sample plugin', () => {
    const results = samplePlugins.map((plugin) => [plugin.id, validatePluginManifest(plugin)] as const)

    expect(results.filter(([, result]) => !result.ok)).toEqual([])
  })

  it('keeps sample plugin folders aligned with the catalog', () => {
    for (const plugin of samplePlugins) {
      expect(plugin.installedPath, plugin.id).toBeTruthy()
      const root = path.resolve(plugin.installedPath!)
      const manifestPath = path.join(root, 'plugin.json')
      const readmePath = path.join(root, 'README.md')

      expect(existsSync(manifestPath), plugin.id).toBe(true)
      expect(existsSync(readmePath), plugin.id).toBe(true)
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      expect(manifest.id).toBe(plugin.id)
      for (const theme of manifest.contributes?.themes ?? []) {
        if (theme.cssFile) expect(existsSync(path.join(root, theme.cssFile)), `${plugin.id}:${theme.cssFile}`).toBe(true)
      }
    }
  })

  it('activates every sample plugin through the public host contract', async () => {
    const host = new PluginHost({ modules: bundledPluginModules })

    await host.activatePlugins(samplePlugins.map((plugin) => ({ ...plugin, enabled: true, sample: false })))

    expect(host.errors).toEqual([])
    expect(host.listCommands().length).toBeGreaterThan(65)
    expect(host.listAiPresets().map((preset) => preset.id)).toEqual(expect.arrayContaining(['clarify', 'concise', 'titles', 'copilot.summary', 'copilot.critique']))
    expect(host.listMarkdownExtensions().map((extension) => extension.id)).toEqual(expect.arrayContaining(['wikilinks', 'powerpack.wikilinks']))
    expect(host.listAiProviders().map((provider) => provider.id)).toEqual(expect.arrayContaining(['openai.responses', 'ollama.local', 'custom.openai-compatible']))
    expect(host.listThemes().map((theme) => theme.id)).toEqual(expect.arrayContaining(['minimal-workspace', 'quiet-focus', 'blue-summit', 'story-codex']))
    expect(host.listThemes().find((theme) => theme.id === 'minimal-workspace')?.settings?.map((setting) => setting.id)).toEqual(expect.arrayContaining(['accent', 'lineWidth', 'hideBorders']))
    expect(host.listPanels().map((panel) => panel.id)).toEqual(expect.arrayContaining(['minimal.layout', 'links.backlinks', 'frontmatter.panel']))
    expect(host.listThemes().filter((theme) => theme.pluginId === 'lightpaper.theme-gallery').every((theme) => theme.cssFile === 'themes.css')).toBe(true)
  })
})

describe('sample plugin pure helpers', () => {
  it('rewrites AI text offline for deterministic tests', () => {
    expect(offlineRewrite({ text: 'We utilize this in order to be very clear.' }, 'clarify').text).toBe('We use this to be clear.')
    expect(offlineRewrite({ text: '# LightPaper\n\nBody text' }, 'titles').text).toContain('LightPaper')
  })

  it('runs copilot workflows with selected model context', () => {
    const input = { text: 'We utilize headings in order to clarify.', model: providerCatalog[0].models[0], provider: providerCatalog[0] }

    expect(rewrite(input).text).toContain('OpenAI Responses API / GPT-5.4')
    expect(critique({ text: '# Title\n\nBody' }).text).toContain('Uses section headings')
    expect(runCopilotPreset('copilot.outline', { text: '# A\n\n## B' }).text).toContain('- A')
  })

  it('extracts wiki links and exposes a remark plugin', () => {
    expect(extractWikiLinks('Read [[Alpha]] and [[Beta|B]].')).toEqual([{ target: 'Alpha', label: 'Alpha' }, { target: 'Beta', label: 'B' }])
    expect(typeof remarkWikiLinks()).toBe('function')
  })

  it('creates dated planning templates', () => {
    const date = new Date('2026-05-17T12:00:00Z')
    expect(todayTemplate(date)).toContain('# 2026-05-17')
    expect(weeklyTemplate(date)).toContain('Weekly Review')
  })

  it('exports simple Markdown forms', () => {
    expect(markdownToSimpleHtml('# Title')).toBe('<h1>Title</h1>')
    expect(markdownToPlainText('[Label](https://example.com)')).toBe('Label')
    expect(staticPage('# Title')).toContain('<!doctype html>')
  })

  it('parses and stringifies frontmatter', () => {
    const parsed = parseFrontmatter('---\ntitle: "Doc"\ntags: ["a", "b"]\n---\n\n# Body')

    expect(parsed.data.title).toBe('Doc')
    expect(stringifyFrontmatter(parsed.data)).toContain('tags: ["a", "b"]')
  })

  it('checks link structure', () => {
    expect(extractLinks('[A](#missing)')).toEqual([{ label: 'A', href: '#missing', image: false }])
    expect(checkLinks('# Present\n\n[A](#missing)\n![](image.png)').issues).toEqual(expect.arrayContaining(['Missing heading anchor: #missing', 'Image missing alt text: image.png']))
  })

  it('lints and formats Markdown issues', () => {
    const issues = lintMarkdown('# A\n### Jump\nText  ')

    expect(formatIssues(issues)).toContain('Heading jumps')
    expect(fixWhitespace('a  \n\n\n\nb')).toBe('a\n\n\nb')
  })

  it('audits publishing readiness', () => {
    const audit = auditPublishingReadiness('# Title\n\n## Section\n\n[Link](https://example.com)')

    expect(audit.score).toBeGreaterThan(40)
    expect(checklistMarkdown('# Title')).toContain('Publishing checklist')
  })

  it('combines Markdown power-pack helpers', () => {
    expect(markdownPowerReport('---\ntitle: Test\n---\n\n# Test\n\n[[Note]]')).toContain('Wiki links: 1')
    const normalized = normalizeMarkdownPowerPack('---\ntitle: Test\n---\n\n# Test  \n\n\n\nBody')
    expect(normalized).toContain('title: "Test"')
    expect(normalized).toContain('# Test')
    expect(normalized).not.toContain('# Test  ')
  })

  it('describes model providers without raw API keys', () => {
    expect(providerCatalog[0].auth.apiKeyRef).toBe('secret://providers/openai/api-key')
    expect(formatModelCatalog()).toContain('OpenAI Responses API')
    expect(formatModelCatalog()).not.toContain('sk-')
  })

  it('builds publisher-kit outputs', () => {
    expect(publishingBrief('# Title\n\n## Section')).toContain('Publisher Kit Brief')
    expect(staticHtmlExportBlock('# Title')).toContain('```html')
  })

  it('formats Markdown tables and delimited text', () => {
    expect(formatMarkdownTable('| A | B |\n| 1 | 22 |')).toContain('| A   | B   |')
    expect(delimitedToMarkdownTable('A,B\n1,2')).toContain('| A   | B   |')
  })

  it('builds popular workflow sample outputs', () => {
    const markdown = '# Project\n\n## Plan\n\n- [ ] Draft due: 2026-06-01\n- [x] Outline\n\nRead [[Source]] #research'

    expect(canvasFlow(markdown)).toContain('flowchart TD')
    expect(queryLensReport(markdown)).toContain('Open tasks: 1')
    expect(taskflowReport(markdown)).toContain('With due dates: 1')
    expect(monthGrid(new Date('2026-05-17T00:00:00Z'))).toContain('[[2026-05-17|17]]')
    expect(versionSnapshot(markdown)).toContain('Checksum:')
    expect(boardFromTasks(markdown)).toContain('### Done')
    expect(syncManifest(markdown, '/notes/project.md')).toContain('"path": "/notes/project.md"')
    expect(ribbonFormat('hello', 'bold')).toBe('**hello**')
    expect(deepIndex(markdown)).toContain('Source')
    expect(importBridgeMarkdown('<h1>Title</h1><ul><li>Item</li></ul>')).toContain('- Item')
    expect(outlineForge(markdown)).toContain('- Project')
    expect(launchpad(markdown)).toContain('# Launchpad')
  })

  it('builds Minimal Workspace demo notes that exercise layout classes', () => {
    expect(styleGuideNote()).toContain('cssClasses: [cards, cards-cols-3, cards-align-bottom, table-wide, row-alt]')
    expect(cardsDemo()).toContain('cards-align-bottom')
    expect(cardsDemo()).toContain('List cards')
    expect(imageGridDemo()).toContain('img-grid')
  })

  it('lets Minimal Workspace commands drive theme settings through the command context', async () => {
    const host = new PluginHost({ modules: { 'lightpaper.minimal-workspace': bundledPluginModules['lightpaper.minimal-workspace'] } })
    let settings: AppSettings = {
      theme: 'obsidian',
      editorMode: 'split',
      syncScroll: true,
      splitRatio: 50,
      fontFamily: 'mono',
      layoutMode: 'standard',
      themeSettings: {},
      aiProvider: 'offline',
    }

    await host.activatePlugins([{ ...samplePlugins.find((plugin) => plugin.id === 'lightpaper.minimal-workspace')!, enabled: true, sample: false }])
    await host.executeCommand('minimal.layoutFocus', { replaceSelection: vi.fn(), insertText: vi.fn(), showToast: vi.fn(), getSettings: () => settings, updateSettings: vi.fn(async (next) => { settings = { ...settings, ...next } }) })
    await host.executeCommand('minimal.toggleColorfulHeadings', { replaceSelection: vi.fn(), insertText: vi.fn(), showToast: vi.fn(), getSettings: () => settings, updateSettings: vi.fn(async (next) => { settings = { ...settings, ...next } }) })

    expect(settings.theme).toBe('minimal-workspace')
    expect(settings.layoutMode).toBe('focus')
    expect(settings.themeSettings['minimal-workspace']?.colorfulHeadings).toBe(true)
  })

  it('executes a representative command against the command context', async () => {
    const host = new PluginHost({ modules: { 'lightpaper.daily-notes': bundledPluginModules['lightpaper.daily-notes'] } })
    const insertText = vi.fn()

    await host.activatePlugins([{ ...samplePlugins.find((plugin) => plugin.id === 'lightpaper.daily-notes')!, enabled: true, sample: false }])
    await host.executeCommand('daily.insertMeetingTemplate', { insertText, replaceSelection: vi.fn(), showToast: vi.fn() })

    expect(insertText.mock.calls[0]?.[0]).toContain('Action Items')
  })
})
