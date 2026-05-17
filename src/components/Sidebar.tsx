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
    <div className={cn('group flex h-8 w-full items-center gap-1 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground', active && 'bg-primary/15 text-foreground')} style={{ paddingLeft: 8 + depth * 14 }}>
      <button className="flex min-w-0 flex-1 items-center gap-2" onClick={() => isFolder ? setOpen(!open) : openFile(node.path)}>
        {isFolder ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
        {isFolder ? open ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary/80" /> : <FileText className="h-4 w-4 text-accent" />}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && <button title="New file" className="hidden rounded p-1 hover:bg-background group-hover:block" onClick={() => createEntry(node.path, 'file')}><FilePlus className="h-3.5 w-3.5" /></button>}
      {isFolder && <button title="New folder" className="hidden rounded p-1 hover:bg-background group-hover:block" onClick={() => createEntry(node.path, 'folder')}><FolderPlus className="h-3.5 w-3.5" /></button>}
      <button title="Delete" className="hidden rounded p-1 hover:bg-destructive/20 group-hover:block" onClick={() => deleteEntry(node.path)}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
    {isFolder && open && node.children?.map((child) => <NodeRow key={child.id} node={child} depth={depth + 1} />)}
  </div>
}

function WorkspaceRoot({ workspace, tree, loading, error }: { workspace: Workspace; tree: FileNode[]; loading?: boolean; error?: string }) {
  const [open, setOpen] = useState(true)
  const { activeWorkspace, createEntry, removeWorkspace } = useAppStore()
  const active = activeWorkspace?.id === workspace.id
  return <section className="mb-2 rounded-xl border bg-background/35 p-1">
    <div className={cn('group flex h-9 items-center gap-1 rounded-lg px-2 text-sm hover:bg-muted', active && 'bg-primary/10')}>
      <button className="flex min-w-0 flex-1 items-center gap-2" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {open ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />}
        <span className="truncate font-medium">{workspace.name}</span>
      </button>
      <button title="New file in this root" className="hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground group-hover:block" onClick={() => createEntry(workspace.path, 'file')}><FilePlus className="h-3.5 w-3.5" /></button>
      <button title="New folder in this root" className="hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground group-hover:block" onClick={() => createEntry(workspace.path, 'folder')}><FolderPlus className="h-3.5 w-3.5" /></button>
      <button title="Unmount folder from LightPaper" className="hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground group-hover:block" onClick={() => removeWorkspace(workspace.id)}><FolderMinus className="h-3.5 w-3.5" /></button>
    </div>
    <div className="truncate px-8 pb-1 text-[10px] text-muted-foreground">{workspace.path}</div>
    {open && <div className="pb-1">
      {loading ? <div className="px-8 py-2 text-xs text-muted-foreground">Loading…</div> : error ? <div className="px-8 py-2 text-xs text-destructive">{error}</div> : tree.length ? tree.map((node) => <NodeRow key={node.id} node={node} depth={1} />) : <div className="px-8 py-2 text-xs text-muted-foreground">No markdown files found.</div>}
    </div>}
  </section>
}

export function Sidebar() {
  const { workspaces, workspaceTrees, addWorkspace, loadAllTrees } = useAppStore()
  return <aside className="flex h-full w-80 shrink-0 flex-col border-r bg-card/55 backdrop-blur-xl">
    <div className="titlebar-drag h-10 shrink-0" />
    <div className="flex items-center justify-between gap-2 border-b px-3 pb-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">LightPaper</div>
        <div className="truncate text-sm font-semibold">{workspaces.length ? `${workspaces.length} mounted folder${workspaces.length === 1 ? '' : 's'}` : 'No folders mounted'}</div>
      </div>
      <div className="titlebar-no-drag flex gap-1">
        <button title="Add folder" className="rounded-md p-2 hover:bg-muted" onClick={addWorkspace}><Plus className="h-4 w-4" /></button>
        <button title="Refresh all" className="rounded-md p-2 hover:bg-muted" onClick={loadAllTrees}><RefreshCw className="h-4 w-4" /></button>
      </div>
    </div>
    <div className="flex-1 overflow-auto p-2">
      {!workspaces.length ? <div className="m-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><p className="mb-3">Add as many local folders as you want. Each one becomes its own tree root.</p><button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground" onClick={addWorkspace}>Choose folder</button></div> : workspaceTrees.map((item) => <WorkspaceRoot key={item.workspace.id} {...item} />)}
    </div>
    <div className="border-t p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2"><FolderPlus className="h-3.5 w-3.5" /> Root minus unmounts only; files stay on disk.</div>
    </div>
  </aside>
}
