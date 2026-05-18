import type { LightPaperPluginApi } from '../../../src/shared/plugin-api'

const themeId = 'minimal-workspace'

export function styleGuideNote() {
  return `---
cssClasses: [cards, cards-cols-3, cards-align-bottom, table-wide, row-alt]
---

# Minimal Workspace style guide

## Layout helpers

This note uses frontmatter classes. The theme can change table width, card layout, and row treatment without changing Markdown content.

| Pattern | Class | Use |
| --- | --- | --- |
| Cards | cards | Turn tables into a card grid |
| Wide table | table-wide | Let structured data escape the reading measure |
| Alternating rows | row-alt | Increase scan speed in dense tables |
| Image grids | img-grid | Turn image-only paragraphs into galleries |
| List cards | list-cards | Turn top-level lists into card stacks |

## Alternate task states

- [/] Drafting
- [>] Forwarded
- [?] Needs answer
- [!] Important
- [x] Done

> [!NOTE] Architecture point
> This is driven by plugin theme metadata, scoped CSS assets, semantic shell slots, and per-note classes.
`
}

export function cardsDemo() {
  return `---
cssClasses: [cards, cards-cols-3, cards-align-bottom]
---

# Cards demo

| Title | Status | Detail |
| --- | --- | --- |
| Draft architecture | Active | Define stable plugin contracts |
| Theme API | Active | Expose settings, layouts, and CSS assets |
| Panel dock | Ready | Mount plugin panels in workspace chrome |
| Preview helpers | Ready | Cards, grids, wide tables, alternate tasks |

## List cards

- **Focus layout** hides app chrome while keeping hover access to controls
- **Wide layout** expands dense tables, media, and split-pane reading
- **Cards layout** turns table-heavy notes into a dashboard-like view
`
}

export function imageGridDemo() {
  return `---
cssClasses: [img-grid, img-wide]
---

# Image grid demo

![One](https://picsum.photos/seed/lightpaper-one/800/800)

![Two](https://picsum.photos/seed/lightpaper-two/800/800)

![Three](https://picsum.photos/seed/lightpaper-three/800/800)

![Four](https://picsum.photos/seed/lightpaper-four/800/800)
`
}

async function activateTheme(apiContext: Parameters<LightPaperPluginApi['commands']['register']>[2] extends (ctx: infer Context) => unknown ? Context : never) {
  if (!apiContext.updateSettings) throw new Error('Settings API is unavailable')
  await apiContext.updateSettings({ theme: themeId })
  apiContext.showToast('Minimal Workspace theme activated')
}

async function setLayout(apiContext: Parameters<LightPaperPluginApi['commands']['register']>[2] extends (ctx: infer Context) => unknown ? Context : never, layoutMode: string) {
  if (!apiContext.updateSettings) throw new Error('Settings API is unavailable')
  await apiContext.updateSettings({ theme: themeId, layoutMode })
  apiContext.showToast(`Minimal layout: ${layoutMode}`)
}

async function toggleMinimalSetting(apiContext: Parameters<LightPaperPluginApi['commands']['register']>[2] extends (ctx: infer Context) => unknown ? Context : never, key: 'colorfulHeadings' | 'hideBorders') {
  if (!apiContext.getSettings || !apiContext.updateSettings) throw new Error('Settings API is unavailable')
  const settings = apiContext.getSettings()
  const currentThemeSettings = settings.themeSettings?.[themeId] ?? {}
  await apiContext.updateSettings({
    theme: themeId,
    themeSettings: {
      ...(settings.themeSettings ?? {}),
      [themeId]: {
        ...currentThemeSettings,
        [key]: !currentThemeSettings[key],
      },
    },
  })
  apiContext.showToast(`Minimal setting toggled: ${key}`)
}

export async function activate(api: LightPaperPluginApi) {
  api.commands.register('minimal.insertStyleGuide', 'Minimal: Insert Style Guide Note', (ctx) => ctx.replaceSelection(styleGuideNote()))
  api.commands.register('minimal.insertCardsDemo', 'Minimal: Insert Cards Demo', (ctx) => ctx.replaceSelection(cardsDemo()))
  api.commands.register('minimal.insertImageGridDemo', 'Minimal: Insert Image Grid Demo', (ctx) => ctx.replaceSelection(imageGridDemo()))
  api.commands.register('minimal.activateTheme', 'Minimal: Activate Theme', (ctx) => activateTheme(ctx))
  api.commands.register('minimal.layoutStandard', 'Minimal: Standard Layout', (ctx) => setLayout(ctx, 'standard'))
  api.commands.register('minimal.layoutFocus', 'Minimal: Focus Layout', (ctx) => setLayout(ctx, 'focus'))
  api.commands.register('minimal.layoutWide', 'Minimal: Wide Layout', (ctx) => setLayout(ctx, 'wide'))
  api.commands.register('minimal.layoutCards', 'Minimal: Cards Layout', (ctx) => setLayout(ctx, 'cards'))
  api.commands.register('minimal.toggleColorfulHeadings', 'Minimal: Toggle Colorful Headings', (ctx) => toggleMinimalSetting(ctx, 'colorfulHeadings'))
  api.commands.register('minimal.toggleHideBorders', 'Minimal: Toggle Workspace Borders', (ctx) => toggleMinimalSetting(ctx, 'hideBorders'))
  api.ui.registerPanel('minimal.layout', 'Minimal Layout', () => {
    const element = document.createElement('div')
    element.innerHTML = [
      '<div class="lp-plugin-panel lp-minimal-panel">',
      '<p class="lp-panel-kicker">Workspace theme</p>',
      '<h3>Minimal controls</h3>',
      '<p>Use Settings to switch Focus, Wide, or Cards layout modes. Add <code>cssClasses</code> to note frontmatter for cards, image grids, and wide tables.</p>',
      '<ul><li><code>cards cards-cols-3</code></li><li><code>img-grid img-wide</code></li><li><code>table-wide row-alt</code></li></ul>',
      '</div>',
    ].join('')
    return element
  })
}
