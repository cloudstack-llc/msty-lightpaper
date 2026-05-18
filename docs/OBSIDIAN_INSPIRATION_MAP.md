# Obsidian Inspiration Map

Research date: 2026-05-18.

Sources:

- Plugin ranking: `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugin-stats.json`, joined to `community-plugins.json`.
- Theme ranking: `https://releases.obsidian.md/stats/theme`, joined to `community-css-themes.json`.
- Directory format reference: `https://github.com/obsidianmd/obsidian-releases`.
- Minimal theme reference: `https://github.com/kepano/obsidian-minimal`.

## Popular Plugin Coverage

LightPaper samples use unique names and implement the closest applicable Markdown-first behavior. Some Obsidian plugins depend on platform capabilities LightPaper does not expose yet, such as real cloud sync, repository writes, OCR, canvas object editing, or full vault-wide indexing. Those are represented as deterministic, testable command workflows.

| Rank | Obsidian plugin | Downloads | LightPaper sample | Similar behavior |
| ---: | --- | ---: | --- | --- |
| 1 | Excalidraw | 6,077,734 | Canvas Sketchbook | Mermaid flow maps and visual decision frames from Markdown structure. |
| 2 | Templater | 4,360,114 | Dynamic Template Lab | Date, time, title, and selected-text template expansion. |
| 3 | Dataview | 4,176,020 | Query Lens | Current-note task, tag, link, heading, and word-count reports. |
| 4 | Tasks | 3,468,753 | Taskflow Planner | Checkbox dashboards and recurring task scaffolds. |
| 5 | Advanced Tables | 2,833,237 | Table Formatter | Markdown table formatting and CSV/TSV conversion. |
| 6 | Calendar | 2,656,471 | Journal Grid | Monthly daily-note grids and today links. |
| 7 | Git | 2,557,958 | Version Ledger | Manual note snapshots with checksums and change sections. |
| 8 | Style Settings | 2,314,404 | Style Studio | Theme token guide for user-tunable appearance. |
| 9 | Kanban | 2,289,648 | Board Stacks | Markdown task boards with backlog, doing, and done sections. |
| 10 | Iconize | 2,008,757 | Symbol Library | Text badge legends for headings and note semantics. |
| 11 | Remotely Save | 1,908,607 | Sync Briefcase | Portable sync manifests and conflict checklists. |
| 12 | QuickAdd | 1,768,314 | Quick Capture | Dated inbox capture blocks from selected/current text. |
| 13 | Minimal Theme Settings | 1,562,479 | Theme Gallery + Style Studio | Installable sample themes plus documented style tokens. |
| 14 | Editing Toolbar | 1,454,454 | Format Ribbon | Toolbar-style formatting commands. |
| 15 | Omnisearch | 1,451,491 | Deep Index Search | Search index note sections for headings, tags, and links. |
| 16 | Copilot | 1,350,407 | AI Copilot Core | AI presets for summary, tags, rewrite, outline, critique, and continuation. |
| 17 | Importer | 1,265,144 | Import Bridge | Simple imported HTML cleanup into Markdown. |
| 18 | Outliner | 1,186,232 | Outline Forge | Heading extraction into editable nested outlines. |
| 19 | Homepage | 1,113,410 | Launchpad Home | Homepage-style note dashboards. |
| 20 | Recent Files | 1,036,573 | Recent Trail | Timestamped active-note trail entries. |

## Popular Theme Coverage

The Theme Gallery sample contributes these unique LightPaper theme IDs. The toolbar only shows them after the sample is installed and enabled.

| Rank | Obsidian theme | Downloads | LightPaper theme | Theme direction |
| ---: | --- | ---: | --- | --- |
| 1 | Minimal | 2,304,308 | Quiet Focus | Restrained dark workspace with quiet contrast. |
| 2 | Things | 1,178,997 | Soft Things | Light, friendly notebook palette. |
| 3 | Blue Topaz | 914,961 | Blue Summit | Deep blue base with vivid accent contrast. |
| 4 | AnuPpuccin | 912,730 | Adaptive Rose | Rounded, pastel dark palette. |
| 5 | Obsidian Nord | 657,413 | Nord Desk | Arctic blues with green accent. |
| 6 | Atom | 508,941 | Atom Craft | Developer-editor blue and amber balance. |
| 7 | Obsidianite | 484,679 | Basalt Night | High-contrast dark purple workspace. |
| 8 | Wasp | 408,920 | Amber Signal | Amber-led dark theme with teal contrast. |
| 9 | Typewriter | 383,345 | Manuscript | Serif preview and paper-like surface. |
| 10 | ITS Theme | 367,734 | Story Codex | Narrative writing palette with warm highlights. |

## Minimal Capability Map

The Minimal theme is not just colors. LightPaper's `Minimal Workspace` sample exists to exercise the same kind of extensibility pressure:

| Minimal capability | LightPaper architecture hook | Sample implementation |
| --- | --- | --- |
| Companion settings plugin | Theme `settings` metadata plus guarded command-time `settings` permission | Accent, contrast, line width, density, colorful headings, hide borders |
| Focus and wide modes | Theme `layoutModes` reflected as `data-lp-layout` on `<html>` | Standard, Focus, Wide, Cards commands and settings controls |
| App chrome styling | Stable semantic slots | `toolbar`, `sidebar`, `editor-stage`, `right-dock`, `bottom-dock` CSS selectors |
| Helper classes | Sanitized frontmatter `cssClasses` applied to preview root | `cards`, `list-cards`, `img-grid`, `table-wide`, `table-max`, `row-alt`, `cards-cover`, media ratios |
| Alternate checkboxes | Remark transform plus sanitized task-state classes | `- [/]`, `- [>]`, `- [?]`, `- [!]`, and related task states |
| Plugin-aware styling | Plugin panels render mounted DOM inside themed slots | `Minimal Layout` panel plus panel CSS scoped under `.theme-minimal-workspace` |
