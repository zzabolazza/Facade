import { useState } from 'react'
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react'
import { Input, Select } from '../../../shared/components'
import type { BrowserCore, BrowserProxy, BrowserGroupWithCount } from '../types'

export interface InstanceFilters {
  keyword: string
  status: '' | 'running' | 'stopped'
  proxyId: string
  coreId: string
  tags: Set<string>
  kwSearch: string
  groupId: string   // '' = 全部, '__ungrouped__' = 未分组, 其他 = 具体分组ID
}

export const EMPTY_FILTERS: InstanceFilters = {
  keyword: '',
  status: '',
  proxyId: '',
  coreId: '',
  tags: new Set(),
  kwSearch: '',
  groupId: '',
}

export function isFiltersEmpty(f: InstanceFilters) {
  return !f.keyword && !f.status && !f.proxyId && !f.coreId && f.tags.size === 0 && !f.kwSearch && !f.groupId
}

interface Props {
  filters: InstanceFilters
  onChange: (f: InstanceFilters) => void
  proxies: BrowserProxy[]
  cores: BrowserCore[]
  allTags: string[]
  groups: BrowserGroupWithCount[]
}

export function InstanceFilterBar({ filters, onChange, proxies, cores, allTags, groups }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const set = <K extends keyof InstanceFilters>(key: K, value: InstanceFilters[K]) =>
    onChange({ ...filters, [key]: value })

  const hasFilter = !isFiltersEmpty(filters)
  const searchValue = filters.keyword || filters.kwSearch
  const selectedTag = filters.tags.size === 1 ? Array.from(filters.tags)[0] : ''
  const activeCount = [searchValue, filters.status, filters.proxyId, filters.coreId, filters.groupId, selectedTag].filter(Boolean).length

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <button
        type="button"
        className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-muted)] px-2.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
        onClick={() => setCollapsed(prev => !prev)}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        <Filter className="h-3.5 w-3.5" />
        筛选
        {activeCount > 0 && (
          <span className="rounded-full bg-[var(--color-accent-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
            {activeCount}
          </span>
        )}
      </button>

      {!collapsed && (
        <>
          <Input
            value={searchValue}
            onChange={e => onChange({ ...filters, keyword: e.target.value, kwSearch: '' })}
            placeholder="搜索名称 / 快捷码 / 关键字..."
            className="h-8 min-w-[220px] flex-1 text-xs"
          />
          <Select value={filters.status} onChange={e => set('status', e.target.value as InstanceFilters['status'])} options={[{ value: '', label: '全部状态' }, { value: 'running', label: '运行中' }, { value: 'stopped', label: '已停止' }]} className="h-8 w-[118px] text-xs" />
          <Select value={filters.proxyId} onChange={e => set('proxyId', e.target.value)} options={[{ value: '', label: '全部代理' }, { value: '__none__', label: '无代理' }, ...proxies.map(p => ({ value: p.proxyId, label: p.proxyName || p.proxyId }))]} className="h-8 w-[148px] text-xs" />
          <Select value={filters.coreId} onChange={e => set('coreId', e.target.value)} options={[{ value: '', label: '全部内核' }, ...cores.map(c => ({ value: c.coreId, label: c.coreName }))]} className="h-8 w-[138px] text-xs" />
          <Select value={filters.groupId} onChange={e => set('groupId', e.target.value)} options={[{ value: '', label: '全部分组' }, { value: '__ungrouped__', label: '未分组' }, ...groups.map(g => ({ value: g.groupId, label: g.groupName }))]} className="h-8 w-[138px] text-xs" />
          <Select
            value={selectedTag}
            onChange={e => set('tags', e.target.value ? new Set([e.target.value]) : new Set())}
            options={[{ value: '', label: '全部标签' }, ...allTags.map(tag => ({ value: tag, label: tag }))]}
            className="h-8 w-[138px] text-xs"
          />
          {hasFilter && (
            <button
              onClick={() => onChange({ ...EMPTY_FILTERS, tags: new Set() })}
              className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-error)]"
            >
              <X className="h-3.5 w-3.5" />
              清除
            </button>
          )}
        </>
      )}
    </div>
  )
}
