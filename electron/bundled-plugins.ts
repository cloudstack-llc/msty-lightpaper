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
      "markdownIt": [
        "wikilinks"
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
      "metadata"
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
  }
]
