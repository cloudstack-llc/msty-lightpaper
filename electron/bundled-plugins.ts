import type { PluginRecord } from '../src/shared/types'

export type SamplePluginRecord = PluginRecord & { sample: true }

export const samplePlugins: SamplePluginRecord[] = [
  {
    "id": "lightpaper.ai-rewrite-toolkit",
    "name": "AI Rewrite Toolkit",
    "version": "0.1.0",
    "description": "Document-aware AI presets for clarity, concision, outlines, summaries, titles, and section rewrites.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "ai",
      "commands"
    ],
    "contributes": {
      "commands": [
        {
          "id": "aiRewrite.clarify",
          "title": "AI: Improve Clarity",
          "category": "AI"
        },
        {
          "id": "aiRewrite.makeConcise",
          "title": "AI: Make Concise",
          "category": "AI"
        },
        {
          "id": "aiRewrite.titleOptions",
          "title": "AI: Generate Title Options",
          "category": "AI"
        }
      ],
      "aiPresets": [
        {
          "id": "clarify",
          "label": "Improve clarity",
          "prompt": "Rewrite this text for clarity while preserving meaning.",
          "scope": "selection"
        },
        {
          "id": "concise",
          "label": "Make concise",
          "prompt": "Make this text concise without losing important detail.",
          "scope": "selection"
        },
        {
          "id": "titles",
          "label": "Generate titles",
          "prompt": "Generate 8 strong title options for this document.",
          "scope": "document"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/ai-rewrite-toolkit"
  },
  {
    "id": "lightpaper.backlinks-wikilinks",
    "name": "Backlinks and Wiki Links",
    "version": "0.1.0",
    "description": "Extract [[wiki links]], outgoing links, unresolved references, and backlink-ready note aliases.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "metadata",
      "markdown",
      "ui"
    ],
    "contributes": {
      "commands": [
        {
          "id": "links.extractWikiLinks",
          "title": "Extract Wiki Links",
          "category": "Knowledge Base"
        },
        {
          "id": "links.insertWikiLink",
          "title": "Insert Wiki Link",
          "category": "Knowledge Base"
        }
      ],
      "markdown": [
        {
          "id": "wikilinks",
          "kind": "remark",
          "description": "Converts [[wiki links]] into preview links with wiki metadata."
        }
      ],
      "panels": [
        {
          "id": "links.backlinks",
          "title": "Backlinks",
          "location": "right"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/backlinks-wikilinks"
  },
  {
    "id": "lightpaper.daily-notes",
    "name": "Daily Notes",
    "version": "0.1.0",
    "description": "Generate daily, weekly, and meeting-note Markdown templates for journaling and planning workflows.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands"
    ],
    "contributes": {
      "commands": [
        {
          "id": "daily.insertTodayTemplate",
          "title": "Insert Today Template",
          "category": "Planning"
        },
        {
          "id": "daily.insertWeeklyTemplate",
          "title": "Insert Weekly Review Template",
          "category": "Planning"
        },
        {
          "id": "daily.insertMeetingTemplate",
          "title": "Insert Meeting Notes Template",
          "category": "Planning"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/daily-notes"
  },
  {
    "id": "lightpaper.export-pack",
    "name": "Export Pack",
    "version": "0.1.0",
    "description": "Prepare Markdown for clean HTML, plain text, and static publishing exports.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "markdown",
      "filesystem"
    ],
    "contributes": {
      "commands": [
        {
          "id": "export.copyHtml",
          "title": "Export Current Document as HTML",
          "category": "Export"
        },
        {
          "id": "export.copyPlainText",
          "title": "Export Current Document as Plain Text",
          "category": "Export"
        },
        {
          "id": "export.prepareStaticPage",
          "title": "Prepare Static HTML Page",
          "category": "Export"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/export-pack"
  },
  {
    "id": "lightpaper.frontmatter-manager",
    "name": "Frontmatter Manager",
    "version": "0.1.0",
    "description": "Parse, normalize, and update YAML frontmatter for titles, tags, status, descriptions, dates, and publishing metadata.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "metadata",
      "ui"
    ],
    "contributes": {
      "commands": [
        {
          "id": "frontmatter.insertOrNormalize",
          "title": "Insert or Normalize Frontmatter",
          "category": "Metadata"
        },
        {
          "id": "frontmatter.touchUpdatedAt",
          "title": "Touch updatedAt Frontmatter",
          "category": "Metadata"
        },
        {
          "id": "frontmatter.extractTitleTags",
          "title": "Extract Title and Tags",
          "category": "Metadata"
        }
      ],
      "panels": [
        {
          "id": "frontmatter.panel",
          "title": "Frontmatter",
          "location": "right"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/frontmatter-manager"
  },
  {
    "id": "lightpaper.link-checker",
    "name": "Link Checker",
    "version": "0.1.0",
    "description": "Find local Markdown links, heading anchors, remote URLs, duplicate references, and likely broken link syntax.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "filesystem",
      "ui"
    ],
    "contributes": {
      "commands": [
        {
          "id": "links.checkCurrentDocument",
          "title": "Check Links in Current Document",
          "category": "Quality"
        },
        {
          "id": "links.listRemoteUrls",
          "title": "List Remote URLs",
          "category": "Quality"
        }
      ],
      "panels": [
        {
          "id": "links.report",
          "title": "Link Report",
          "location": "bottom"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/link-checker"
  },
  {
    "id": "lightpaper.markdown-linter",
    "name": "Markdown Linter",
    "version": "0.1.0",
    "description": "Detect heading jumps, duplicate headings, long lines, missing alt text, trailing whitespace, and Markdown formatting issues.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "ui"
    ],
    "contributes": {
      "commands": [
        {
          "id": "lint.currentDocument",
          "title": "Lint Current Markdown Document",
          "category": "Quality"
        },
        {
          "id": "lint.fixWhitespace",
          "title": "Fix Markdown Whitespace",
          "category": "Quality"
        }
      ],
      "panels": [
        {
          "id": "lint.diagnostics",
          "title": "Markdown Diagnostics",
          "location": "bottom"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/markdown-linter"
  },
  {
    "id": "lightpaper.publishing-seo-checklist",
    "name": "Publishing and SEO Checklist",
    "version": "0.1.0",
    "description": "Score documents for publishing readiness: title, description, heading hierarchy, links, image alt text, reading time, and frontmatter.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "metadata",
      "ui"
    ],
    "contributes": {
      "commands": [
        {
          "id": "publish.auditCurrentDocument",
          "title": "Audit Publishing Readiness",
          "category": "Publishing"
        },
        {
          "id": "publish.insertChecklist",
          "title": "Insert Publishing Checklist",
          "category": "Publishing"
        }
      ],
      "panels": [
        {
          "id": "publish.checklist",
          "title": "Publishing Checklist",
          "location": "right"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/publishing-seo-checklist"
  },
  {
    "id": "lightpaper.snippet-template-library",
    "name": "Snippet and Template Library",
    "version": "0.1.0",
    "description": "Insert reusable Markdown templates for project briefs, ADRs, bug reports, changelogs, and release notes.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands",
      "filesystem",
      "ui"
    ],
    "contributes": {
      "commands": [
        {
          "id": "templates.insertAdr",
          "title": "Insert Architecture Decision Record",
          "category": "Templates"
        },
        {
          "id": "templates.insertBugReport",
          "title": "Insert Bug Report",
          "category": "Templates"
        },
        {
          "id": "templates.insertReleaseNotes",
          "title": "Insert Release Notes",
          "category": "Templates"
        },
        {
          "id": "templates.insertProjectBrief",
          "title": "Insert Project Brief",
          "category": "Templates"
        }
      ],
      "panels": [
        {
          "id": "templates.library",
          "title": "Templates",
          "location": "right"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/snippet-template-library"
  },
  {
    "id": "lightpaper.minimal-workspace",
    "name": "Minimal Workspace",
    "version": "0.1.0",
    "description": "A serious workspace theme sample with layout modes, theme settings, frontmatter helper classes, and a docked companion panel.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands", "settings", "ui"],
    "contributes": {
      "commands": [
        { "id": "minimal.insertStyleGuide", "title": "Minimal: Insert Style Guide Note", "category": "Themes" },
        { "id": "minimal.insertCardsDemo", "title": "Minimal: Insert Cards Demo", "category": "Themes" },
        { "id": "minimal.insertImageGridDemo", "title": "Minimal: Insert Image Grid Demo", "category": "Themes" },
        { "id": "minimal.activateTheme", "title": "Minimal: Activate Theme", "category": "Themes" },
        { "id": "minimal.layoutStandard", "title": "Minimal: Standard Layout", "category": "Themes" },
        { "id": "minimal.layoutFocus", "title": "Minimal: Focus Layout", "category": "Themes" },
        { "id": "minimal.layoutWide", "title": "Minimal: Wide Layout", "category": "Themes" },
        { "id": "minimal.layoutCards", "title": "Minimal: Cards Layout", "category": "Themes" },
        { "id": "minimal.toggleColorfulHeadings", "title": "Minimal: Toggle Colorful Headings", "category": "Themes" },
        { "id": "minimal.toggleHideBorders", "title": "Minimal: Toggle Workspace Borders", "category": "Themes" }
      ],
      "panels": [
        { "id": "minimal.layout", "title": "Minimal Layout", "location": "right" }
      ],
      "themes": [
        {
          "id": "minimal-workspace",
          "label": "Minimal Workspace",
          "modes": ["dark", "light"],
          "inspiration": "Obsidian Minimal",
          "description": "A low-chrome workspace theme with focus modes, wide content helpers, cards, image grids, and per-theme settings.",
          "cssFile": "minimal-workspace.css",
          "layoutModes": [
            { "id": "focus", "label": "Focus", "description": "Suppresses chrome and docks for long-form writing." },
            { "id": "wide", "label": "Wide", "description": "Expands tables, images, and split work." },
            { "id": "cards", "label": "Cards", "description": "Optimizes preview spacing for card and gallery notes." }
          ],
          "settings": [
            { "id": "accent", "label": "Accent", "type": "select", "defaultValue": "blue", "dataAttribute": "lp-theme-accent", "options": [{ "value": "blue", "label": "Blue" }, { "value": "mono", "label": "Mono" }, { "value": "green", "label": "Green" }, { "value": "orange", "label": "Orange" }] },
            { "id": "contrast", "label": "Background contrast", "type": "select", "defaultValue": "low", "dataAttribute": "lp-theme-contrast", "options": [{ "value": "low", "label": "Low contrast" }, { "value": "high", "label": "High contrast" }, { "value": "black", "label": "True black" }] },
            { "id": "lineWidth", "label": "Line width", "type": "select", "defaultValue": "68ch", "cssVariable": "--preview-measure", "options": [{ "value": "58ch", "label": "Narrow" }, { "value": "68ch", "label": "Normal" }, { "value": "82ch", "label": "Wide" }, { "value": "104ch", "label": "Maximum" }] },
            { "id": "density", "label": "Interface density", "type": "select", "defaultValue": "airy", "dataAttribute": "lp-theme-density", "options": [{ "value": "airy", "label": "Airy" }, { "value": "compact", "label": "Compact" }] },
            { "id": "colorfulHeadings", "label": "Colorful headings", "type": "toggle", "defaultValue": false, "dataAttribute": "lp-colorful-headings" },
            { "id": "hideBorders", "label": "Hide workspace borders", "type": "toggle", "defaultValue": false, "dataAttribute": "lp-hide-borders" }
          ],
          "previewClasses": [
            { "id": "cards", "label": "Cards", "description": "Turns tables into card grids." },
            { "id": "list-cards", "label": "List cards", "description": "Turns top-level lists into card grids." },
            { "id": "cards-cover", "label": "Cover images" },
            { "id": "cards-16-9", "label": "16:9 card media" },
            { "id": "cards-1-1", "label": "Square card media" },
            { "id": "cards-cols-2", "label": "Two card columns" },
            { "id": "cards-cols-3", "label": "Three card columns" },
            { "id": "img-grid", "label": "Image grid", "description": "Places image-only paragraphs into a grid." },
            { "id": "img-grid-ratio", "label": "Contain image grid" },
            { "id": "img-wide", "label": "Wide images" },
            { "id": "img-max", "label": "Max-width images" },
            { "id": "table-wide", "label": "Wide tables" },
            { "id": "table-max", "label": "Max-width tables" },
            { "id": "table-small", "label": "Small tables" },
            { "id": "table-lines", "label": "Table cell lines" },
            { "id": "row-alt", "label": "Alternating table rows" }
          ]
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/minimal-workspace"
  },
  {
    "id": "lightpaper.table-formatter",
    "name": "Table Formatter",
    "version": "0.1.0",
    "description": "Format Markdown tables, convert CSV/TSV to tables, and normalize column alignment.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [
      "commands"
    ],
    "contributes": {
      "commands": [
        {
          "id": "table.formatSelection",
          "title": "Format Markdown Table",
          "category": "Editing"
        },
        {
          "id": "table.csvToMarkdown",
          "title": "Convert CSV/TSV to Markdown Table",
          "category": "Editing"
        },
        {
          "id": "table.insertStarter",
          "title": "Insert Starter Table",
          "category": "Editing"
        }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/table-formatter"
  },
  {
    "id": "lightpaper.ai-copilot",
    "name": "AI Copilot Core",
    "version": "0.1.0",
    "description": "First-party AI writing workflows for summaries, tags, rewrites, outlines, critique, and continuation.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["ai", "commands"],
    "contributes": {
      "commands": [
        { "id": "copilot.summarizeDocument", "title": "Copilot: Summarize Document", "category": "AI" },
        { "id": "copilot.generateTags", "title": "Copilot: Generate Tags", "category": "AI" },
        { "id": "copilot.rewriteSelection", "title": "Copilot: Rewrite Selection", "category": "AI" },
        { "id": "copilot.outlineDocument", "title": "Copilot: Outline Document", "category": "AI" },
        { "id": "copilot.critiqueDraft", "title": "Copilot: Critique Draft", "category": "AI" },
        { "id": "copilot.continueDraft", "title": "Copilot: Continue Draft", "category": "AI" }
      ],
      "aiPresets": [
        { "id": "copilot.summary", "label": "Copilot: Summarize", "prompt": "Summarize the current note.", "scope": "document" },
        { "id": "copilot.tags", "label": "Copilot: Generate tags", "prompt": "Generate useful tags.", "scope": "document" },
        { "id": "copilot.rewrite", "label": "Copilot: Rewrite sharper", "prompt": "Rewrite for clarity.", "scope": "selection" },
        { "id": "copilot.outline", "label": "Copilot: Outline", "prompt": "Outline the document.", "scope": "document" },
        { "id": "copilot.critique", "label": "Copilot: Critique draft", "prompt": "Critique the draft.", "scope": "document" },
        { "id": "copilot.continue", "label": "Copilot: Continue draft", "prompt": "Continue the draft.", "scope": "document" }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/ai-copilot-core"
  },
  {
    "id": "lightpaper.markdown-powerpack",
    "name": "Markdown Power Pack",
    "version": "0.1.0",
    "description": "Curated Markdown power tools: wiki-link rendering, callouts, lint reports, frontmatter-safe normalization, and table formatting.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands", "markdown", "metadata"],
    "contributes": {
      "commands": [
        { "id": "powerpack.insertCallout", "title": "Power Pack: Insert Callout", "category": "Markdown" },
        { "id": "powerpack.auditMarkdown", "title": "Power Pack: Audit Markdown", "category": "Markdown" },
        { "id": "powerpack.normalizeMarkdown", "title": "Power Pack: Normalize Markdown", "category": "Markdown" },
        { "id": "powerpack.formatTable", "title": "Power Pack: Format Table", "category": "Markdown" }
      ],
      "markdown": [
        { "id": "powerpack.wikilinks", "kind": "remark", "description": "Converts [[wiki links]] into preview links." }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/markdown-power-pack"
  },
  {
    "id": "lightpaper.publisher-kit",
    "name": "Publisher Kit",
    "version": "0.1.0",
    "description": "Publishing workflow tools for readiness audits, checklists, static HTML preparation, and plain-text exports.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands", "filesystem", "markdown", "metadata"],
    "contributes": {
      "commands": [
        { "id": "publisher.auditDocument", "title": "Publisher Kit: Audit Document", "category": "Publishing" },
        { "id": "publisher.insertChecklist", "title": "Publisher Kit: Insert Checklist", "category": "Publishing" },
        { "id": "publisher.prepareStaticHtml", "title": "Publisher Kit: Prepare Static HTML", "category": "Publishing" },
        { "id": "publisher.appendPlainText", "title": "Publisher Kit: Append Plain Text Export", "category": "Publishing" }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/publisher-kit"
  },
  {
    "id": "lightpaper.model-provider-catalog",
    "name": "Model Provider Catalog",
    "version": "0.1.0",
    "description": "Registers selectable model/provider configs with endpoints, capabilities, pricing metadata, and secret references for API keys.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["ai", "commands"],
    "contributes": {
      "commands": [
        { "id": "modelProvider.insertCatalog", "title": "Insert Model Provider Catalog", "category": "AI" }
      ],
      "aiProviders": [
        { "id": "openai.responses", "title": "OpenAI Responses API", "models": ["gpt-5.4", "gpt-5.4-mini"] },
        { "id": "anthropic.messages", "title": "Anthropic Messages API", "models": ["claude-sonnet", "claude-haiku"] },
        { "id": "ollama.local", "title": "Ollama Local", "models": ["llama-local"] },
        { "id": "custom.openai-compatible", "title": "Custom OpenAI-compatible Gateway", "models": ["gateway-default"] }
      ]
    },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/model-provider-catalog"
  },
  {
    "id": "lightpaper.canvas-sketchbook",
    "name": "Canvas Sketchbook",
    "version": "0.1.0",
    "description": "Markdown-native visual thinking commands for flow maps and decision frames inspired by popular canvas drawing workflows.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "canvasSketch.insertFlowMap", "title": "Insert Canvas Flow Map", "category": "Visual Thinking" },
      { "id": "canvasSketch.insertDecisionFrame", "title": "Insert Visual Decision Frame", "category": "Visual Thinking" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/canvas-sketchbook"
  },
  {
    "id": "lightpaper.dynamic-template-lab",
    "name": "Dynamic Template Lab",
    "version": "0.1.0",
    "description": "Variable-driven daily and project note templates with date, time, title, and selected-text placeholders.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "dynamicTemplate.renderDailyPlan", "title": "Render Dynamic Daily Plan", "category": "Templates" },
      { "id": "dynamicTemplate.renderProjectNote", "title": "Render Dynamic Project Note", "category": "Templates" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/dynamic-template-lab"
  },
  {
    "id": "lightpaper.query-lens",
    "name": "Query Lens",
    "version": "0.1.0",
    "description": "Dataview-style current-note summaries for headings, tasks, tags, links, and word counts.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "queryLens.insertReport", "title": "Insert Query Lens Report", "category": "Knowledge Base" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/query-lens"
  },
  {
    "id": "lightpaper.taskflow-planner",
    "name": "Taskflow Planner",
    "version": "0.1.0",
    "description": "Task dashboards and recurring task scaffolds for Markdown checkbox workflows.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "taskflow.insertDashboard", "title": "Insert Taskflow Dashboard", "category": "Planning" },
      { "id": "taskflow.insertRecurringTask", "title": "Insert Recurring Task Template", "category": "Planning" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/taskflow-planner"
  },
  {
    "id": "lightpaper.journal-grid",
    "name": "Journal Grid",
    "version": "0.1.0",
    "description": "Calendar-inspired monthly grids and daily-note links for journal navigation.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "journalGrid.insertMonth", "title": "Insert Month Grid", "category": "Planning" },
      { "id": "journalGrid.insertTodayLink", "title": "Insert Today Link", "category": "Planning" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/journal-grid"
  },
  {
    "id": "lightpaper.version-ledger",
    "name": "Version Ledger",
    "version": "0.1.0",
    "description": "Git-inspired manual note snapshots with checksum, word count, and change-note sections.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "versionLedger.insertSnapshot", "title": "Insert Version Snapshot", "category": "Versioning" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/version-ledger"
  },
  {
    "id": "lightpaper.board-stacks",
    "name": "Board Stacks",
    "version": "0.1.0",
    "description": "Markdown-backed board scaffolds that organize open and completed tasks into columns.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "boardStacks.fromTasks", "title": "Create Board From Tasks", "category": "Planning" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/board-stacks"
  },
  {
    "id": "lightpaper.symbol-library",
    "name": "Symbol Library",
    "version": "0.1.0",
    "description": "Icon-style text badges and heading legends for visual organization without binary assets.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "symbolLibrary.insertLegend", "title": "Insert Symbol Legend", "category": "Editing" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/symbol-library"
  },
  {
    "id": "lightpaper.sync-briefcase",
    "name": "Sync Briefcase",
    "version": "0.1.0",
    "description": "Portable sync manifests and conflict checklists for manual backup workflows.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "syncBriefcase.insertManifest", "title": "Insert Portable Sync Manifest", "category": "Sync" },
      { "id": "syncBriefcase.insertConflictChecklist", "title": "Insert Sync Conflict Checklist", "category": "Sync" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/sync-briefcase"
  },
  {
    "id": "lightpaper.quick-capture",
    "name": "Quick Capture",
    "version": "0.1.0",
    "description": "Fast inbox capture blocks for turning selection or the current note into an actionable entry.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "quickCapture.toInbox", "title": "Capture Selection to Inbox", "category": "Capture" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/quick-capture"
  },
  {
    "id": "lightpaper.style-studio",
    "name": "Style Studio",
    "version": "0.1.0",
    "description": "Theme-token documentation and style-setting notes for tuning LightPaper appearance.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "styleStudio.insertTokenGuide", "title": "Insert Style Token Guide", "category": "Appearance" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/style-studio"
  },
  {
    "id": "lightpaper.format-ribbon",
    "name": "Format Ribbon",
    "version": "0.1.0",
    "description": "Toolbar-style formatting commands for bold text, code fences, and callouts.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "formatRibbon.boldSelection", "title": "Ribbon: Bold Selection", "category": "Editing" },
      { "id": "formatRibbon.codeFence", "title": "Ribbon: Code Fence", "category": "Editing" },
      { "id": "formatRibbon.callout", "title": "Ribbon: Callout", "category": "Editing" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/format-ribbon"
  },
  {
    "id": "lightpaper.deep-index-search",
    "name": "Deep Index Search",
    "version": "0.1.0",
    "description": "Omni-search inspired document indexes for headings, tags, links, and note navigation.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "deepIndex.insertSearchIndex", "title": "Insert Deep Search Index", "category": "Search" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/deep-index-search"
  },
  {
    "id": "lightpaper.import-bridge",
    "name": "Import Bridge",
    "version": "0.1.0",
    "description": "Clean imported HTML paste into Markdown headings, lists, and readable plain text.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "importBridge.cleanPaste", "title": "Clean Imported HTML Paste", "category": "Import" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/import-bridge"
  },
  {
    "id": "lightpaper.outline-forge",
    "name": "Outline Forge",
    "version": "0.1.0",
    "description": "Outliner-style heading extraction and structured outline insertion for long notes.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "outlineForge.insertOutline", "title": "Insert Structured Outline", "category": "Editing" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/outline-forge"
  },
  {
    "id": "lightpaper.launchpad-home",
    "name": "Launchpad Home",
    "version": "0.1.0",
    "description": "Homepage-style note dashboards with continue, open-task, and link sections.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "launchpad.insertHome", "title": "Insert Workspace Launchpad", "category": "Workspace" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/launchpad-home"
  },
  {
    "id": "lightpaper.recent-trail",
    "name": "Recent Trail",
    "version": "0.1.0",
    "description": "Recent-files inspired manual trail entries for the active note.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": ["commands"],
    "contributes": { "commands": [
      { "id": "recentTrail.recordCurrent", "title": "Record Current Note Trail", "category": "Workspace" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/recent-trail"
  },
  {
    "id": "lightpaper.theme-gallery",
    "name": "Theme Gallery",
    "version": "0.1.0",
    "description": "Ten installable sample themes inspired by popular Obsidian community theme families.",
    "author": "Msty LightPaper",
    "main": "index.ts",
    "permissions": [],
    "contributes": { "themes": [
      { "id": "quiet-focus", "label": "Quiet Focus", "modes": ["dark", "light"], "inspiration": "Minimal", "cssFile": "themes.css" },
      { "id": "soft-things", "label": "Soft Things", "modes": ["dark", "light"], "inspiration": "Things", "cssFile": "themes.css" },
      { "id": "blue-summit", "label": "Blue Summit", "modes": ["dark", "light"], "inspiration": "Blue Topaz", "cssFile": "themes.css" },
      { "id": "adaptive-rose", "label": "Adaptive Rose", "modes": ["dark", "light"], "inspiration": "AnuPpuccin", "cssFile": "themes.css" },
      { "id": "nord-desk", "label": "Nord Desk", "modes": ["dark", "light"], "inspiration": "Obsidian Nord", "cssFile": "themes.css" },
      { "id": "atom-craft", "label": "Atom Craft", "modes": ["dark", "light"], "inspiration": "Atom", "cssFile": "themes.css" },
      { "id": "basalt-night", "label": "Basalt Night", "modes": ["dark"], "inspiration": "Obsidianite", "cssFile": "themes.css" },
      { "id": "amber-signal", "label": "Amber Signal", "modes": ["dark", "light"], "inspiration": "Wasp", "cssFile": "themes.css" },
      { "id": "manuscript", "label": "Manuscript", "modes": ["dark", "light"], "inspiration": "Typewriter", "cssFile": "themes.css" },
      { "id": "story-codex", "label": "Story Codex", "modes": ["dark", "light"], "inspiration": "ITS Theme", "cssFile": "themes.css" }
    ] },
    "enabled": false,
    "builtin": false,
    "sample": true,
    "installedPath": "plugins/samples/theme-gallery"
  }
]
