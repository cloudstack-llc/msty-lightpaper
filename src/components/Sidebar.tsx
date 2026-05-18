import { ChevronDown, ChevronRight, FilePlus, FileText, Folder, FolderOpen, FolderMinus, FolderPlus, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FileNode, Workspace } from '@shared/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

function NodeRow({ node, depth }: { node: FileNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1)
  const { activeFile, openFile, createEntry, deleteEntry } = useAppStore()
  const isFolder = node.kind === 'folder'
  const active = activeFile === node.path
  return <div>
    <div className={cn('flex min-h-8 w-full items-center gap-1 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground', active && 'bg-primary/15 text-foreground')} style={{ paddingLeft: 8 + depth * 14 }}>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 py-1" onClick={() => isFolder ? setOpen(!open) : void openFile(node.path)}>
        {isFolder ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
        {isFolder ? open ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary/80" /> : <FileText className="h-4 w-4 text-accent" />}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && <button type="button" title="New file" className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-border hover:bg-background" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void createEntry(node.path, 'file') }}><FilePlus className="h-3.5 w-3.5" /></button>}
      {isFolder && <button type="button" title="New folder" className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-border hover:bg-background" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void createEntry(node.path, 'folder') }}><FolderPlus className="h-3.5 w-3.5" /></button>}
      <button type="button" title="Delete" className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-border hover:bg-destructive/20" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void deleteEntry(node.path) }}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
    {isFolder && open && node.children?.map((child) => <NodeRow key={child.id} node={child} depth={depth + 1} />)}
  </div>
}

function WorkspaceRoot({ workspace, tree, loading, error }: { workspace: Workspace; tree: FileNode[]; loading?: boolean; error?: string }) {
  const [open, setOpen] = useState(true)
  const { activeWorkspace, createEntry, removeWorkspace } = useAppStore()
  const active = activeWorkspace?.id === workspace.id
  return <section className="mb-3 overflow-hidden rounded-xl border bg-background/35">
    <div className={cn('flex items-center gap-2 border-b px-2 py-2 text-sm', active && 'bg-primary/10')}>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {open ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />}
        <span className="truncate font-medium">{workspace.name}</span>
      </button>
      <button type="button" title="Unmount folder from LightPaper" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void removeWorkspace(workspace.id) }}><FolderMinus className="h-3.5 w-3.5" /></button>
    </div>
    <div className="border-b bg-card/35 px-3 py-2">
      <div className="mb-2 truncate text-[10px] text-muted-foreground">{workspace.path}</div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="rounded-lg border bg-background px-2 py-1.5 text-xs font-medium hover:border-primary hover:text-foreground" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void createEntry(workspace.path, 'file') }}><FilePlus className="mr-1.5 inline h-3.5 w-3.5" />New file</button>
        <button type="button" className="rounded-lg border bg-background px-2 py-1.5 text-xs font-medium hover:border-primary hover:text-foreground" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void createEntry(workspace.path, 'folder') }}><FolderPlus className="mr-1.5 inline h-3.5 w-3.5" />New folder</button>
      </div>
    </div>
    {open && <div className="p-1">
      {loading ? <div className="px-8 py-2 text-xs text-muted-foreground">Loading…</div> : error ? <div className="px-8 py-2 text-xs text-destructive">{error}</div> : tree.length ? tree.map((node) => <NodeRow key={node.id} node={node} depth={1} />) : <div className="px-3 py-3 text-xs text-muted-foreground">No markdown files found yet. Use the New file button above.</div>}
    </div>}
  </section>
}

export function Sidebar() {
  const { workspaces, workspaceTrees, addWorkspace, loadAllTrees, lastError, lastAction } = useAppStore()
  return <aside data-lp-slot="sidebar" className="flex h-full w-80 shrink-0 flex-col border-r bg-card/55 backdrop-blur-xl">
    <div className="titlebar-drag h-10 shrink-0" />
    <div className="titlebar-no-drag flex items-center justify-between gap-2 border-b px-3 pb-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">LightPaper</div>
        <div className="truncate text-sm font-semibold">{workspaces.length ? `${workspaces.length} mounted folder${workspaces.length === 1 ? '' : 's'}` : 'No folders mounted'}</div>
      </div>
      <div className="titlebar-no-drag flex gap-1">
        <button type="button" title="Add folder" className="rounded-md p-2 hover:bg-muted" onClick={() => void addWorkspace()}><Plus className="h-4 w-4" /></button>
        <button type="button" title="Refresh all" className="rounded-md p-2 hover:bg-muted" onClick={() => void loadAllTrees()}><RefreshCw className="h-4 w-4" /></button>
      </div>
    </div>
    {(lastError || lastAction) && <div className={cn('border-b px-3 py-2 text-xs', lastError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-muted-foreground')}>{lastError || lastAction}</div>}
    <div className="titlebar-no-drag flex-1 overflow-auto p-2">
      {!workspaces.length ? <div className="m-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><p className="mb-3">Add as many local folders as you want. Each one becomes its own tree root.</p><button type="button" className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={() => void addWorkspace()}>Choose folder</button></div> : workspaceTrees.map((item) => <WorkspaceRoot key={item.workspace.id} {...item} />)}
    </div>
    <div className="titlebar-no-drag border-t p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2"><FolderPlus className="h-3.5 w-3.5" /> Root minus unmounts only; files stay on disk.</div>
    </div>
  </aside>
}
