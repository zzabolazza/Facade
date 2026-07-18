import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Pencil, Trash2, FolderInput } from 'lucide-react'
import type { BrowserGroupWithCount, BrowserGroupInput } from '../types'
import { createGroup, updateGroup, deleteGroup } from '../api'
import { Button, ConfirmModal, Input, Modal, Select } from '../../../shared/components'

interface GroupTreeNavProps {
  groups: BrowserGroupWithCount[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string | null) => void
  onRefresh: () => void
}

interface TreeNode extends BrowserGroupWithCount {
  children: TreeNode[]
  level: number
}

// 构建树形结构
function buildTree(groups: BrowserGroupWithCount[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // 初始化所有节点
  groups.forEach(g => {
    map.set(g.groupId, { ...g, children: [], level: 0 })
  })

  // 构建父子关系
  groups.forEach(g => {
    const node = map.get(g.groupId)!
    if (g.parentId && map.has(g.parentId)) {
      const parent = map.get(g.parentId)!
      node.level = parent.level + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // 按 sortOrder 排序
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(n => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}

export function GroupTreeNav({ groups, selectedGroupId, onSelectGroup, onRefresh }: GroupTreeNavProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createParentId, setCreateParentId] = useState<string>('')
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroup, setEditingGroup] = useState<BrowserGroupWithCount | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<BrowserGroupWithCount | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; group: BrowserGroupWithCount } | null>(null)

  const tree = useMemo(() => buildTree(groups), [groups])

  const toggleExpand = (groupId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleCreate = async () => {
    if (!newGroupName.trim()) return
    const input: BrowserGroupInput = {
      groupName: newGroupName.trim(),
      parentId: createParentId,
      sortOrder: 0,
    }
    await createGroup(input)
    setShowCreateModal(false)
    setNewGroupName('')
    setCreateParentId('')
    onRefresh()
  }

  const handleRename = async () => {
    if (!editingGroup || !newGroupName.trim()) return
    const input: BrowserGroupInput = {
      groupName: newGroupName.trim(),
      parentId: editingGroup.parentId,
      sortOrder: editingGroup.sortOrder,
    }
    await updateGroup(editingGroup.groupId, input)
    setEditingGroup(null)
    setNewGroupName('')
    onRefresh()
  }

  const handleDelete = async () => {
    if (!deletingGroup) return
    await deleteGroup(deletingGroup.groupId)
    if (selectedGroupId === deletingGroup.groupId) {
      onSelectGroup(null)
    }
    setDeletingGroup(null)
    onRefresh()
  }

  const handleContextMenu = (e: React.MouseEvent, group: BrowserGroupWithCount) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, group })
  }

  const renderNode = (node: TreeNode) => {
    const isExpanded = expanded.has(node.groupId)
    const isSelected = selectedGroupId === node.groupId
    const hasChildren = node.children.length > 0

    return (
      <div key={node.groupId}>
        <div
          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] ${
            isSelected ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' : ''
          }`}
          style={{ paddingLeft: `${node.level * 16 + 12}px` }}
          onClick={() => onSelectGroup(node.groupId)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {hasChildren ? (
            <button
              className="shrink-0 rounded p-0 hover:bg-[var(--color-border-muted)]"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.groupId) }}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : null}
          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
          )}
          <span className="flex-1 truncate text-sm">{node.groupName}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{node.instanceCount}</span>
        </div>
        {isExpanded && node.children.map(child => renderNode(child))}
      </div>
    )
  }

  return (
    <div className="flex h-full w-48 flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-muted)] p-2">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">分组</span>
        <button
          className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-muted)] hover:text-[var(--color-accent)]"
          onClick={() => { setNewGroupName(''); setCreateParentId(''); setShowCreateModal(true) }}
          title="新建分组"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* 全部 */}
        <div
          className={`mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] ${
            selectedGroupId === null ? 'bg-[var(--color-accent-muted)] font-medium text-[var(--color-accent)]' : ''
          }`}
          onClick={() => onSelectGroup(null)}
        >
          <Folder className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="flex-1 text-sm">全部</span>
        </div>

        {/* 未分组 */}
        <div
          className={`mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] ${
            selectedGroupId === '__ungrouped__' ? 'bg-[var(--color-accent-muted)] font-medium text-[var(--color-accent)]' : ''
          }`}
          onClick={() => onSelectGroup('__ungrouped__')}
        >
          <FolderInput className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="flex-1 text-sm">未分组</span>
        </div>

        {/* 分组树 */}
        {tree.length > 0 && (
          <div className="mt-2 mx-1">
            <div className="px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">我的分组</div>
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* 创建分组弹窗 */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建分组"
        width="380px"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!newGroupName.trim()}>创建</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input
            placeholder="分组名称"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
            autoFocus
          />
          {groups.length > 0 && (
            <Select
              value={createParentId}
              onChange={e => setCreateParentId(e.target.value)}
              options={[
                { value: '', label: '根级分组' },
                ...groups.map(g => ({ value: g.groupId, label: g.groupName })),
              ]}
            />
          )}
        </div>
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        open={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        title="重命名分组"
        width="380px"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setEditingGroup(null)}>取消</Button>
            <Button onClick={handleRename} disabled={!newGroupName.trim()}>保存</Button>
          </>
        )}
      >
        <Input
          placeholder="分组名称"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void handleRename() }}
          autoFocus
        />
      </Modal>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-40 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] py-1.5 shadow-[var(--shadow-lg)]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
            onClick={() => { setNewGroupName(''); setCreateParentId(contextMenu.group.groupId); setShowCreateModal(true) }}
          >
            <Plus className="w-4 h-4" /> 新建子分组
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
            onClick={() => { setNewGroupName(contextMenu.group.groupName); setEditingGroup(contextMenu.group) }}
          >
            <Pencil className="w-4 h-4" /> 重命名
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-error)] hover:bg-[rgb(239_71_87_/_0.08)]"
            onClick={() => setDeletingGroup(contextMenu.group)}
          >
            <Trash2 className="w-4 h-4" /> 删除
          </button>
        </div>
      )}

      {/* 点击其他地方关闭右键菜单 */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
      )}

      <ConfirmModal
        open={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleDelete}
        title="删除分组"
        content={`确定删除分组「${deletingGroup?.groupName || ''}」？子分组和实例将移动到父分组。`}
        confirmText="删除分组"
        danger
      />
    </div>
  )
}
