# Fleet Console UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the default Ant Browser shell and browser instance list page into the high-fidelity fleet-console UI described in `docs/superpowers/specs/2026-07-17-fleet-console-ui-redesign-design.md`.

**Architecture:** Use a theme-first implementation so shared primitives inherit the new visual foundation, then update shell and list-specific components without changing API/data behavior. Keep existing React routes, hooks, Zustand state, Wails calls, modals, and action handlers intact.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind utility classes, lucide-react, Zustand, Wails runtime bindings.

**Commit Policy:** The user requested no git commits. Treat each task's final step as a checkpoint only; do not run `git commit`.

---

## File Structure

- Modify `frontend/src/shared/theme/themes/base.css`: keep root aliases aligned with the new default tokens.
- Modify `frontend/src/shared/theme/themes/light.css`: replace default light colors with the fleet-console palette.
- Modify `frontend/src/shared/components/Button.tsx`: tighten radius, sizing, and variant classes.
- Modify `frontend/src/shared/components/Card.tsx`: use 10px-or-less radius and restrained borders.
- Modify `frontend/src/shared/components/Table.tsx`: add bordered table shell, denser row padding, muted uppercase headers, and stable empty/loading treatment.
- Modify `frontend/src/shared/layout/Layout.tsx`: remove nested page padding assumptions and let pages own their density.
- Modify `frontend/src/shared/layout/Sidebar.tsx`: rebuild the visual layer while preserving `navigationConfig`, `useLocation`, and `useLayoutStore`.
- Modify `frontend/src/shared/layout/Topbar.tsx`: add route-aware title/path, search entry, and avatar/theme affordances while preserving notifications and docs modal.
- Modify `frontend/src/modules/browser/components/BrowserListLayout.tsx`: convert header into page intro, stat cards, action cluster, and filter toolbar wrapper.
- Modify `frontend/src/modules/browser/components/InstanceFilterBar.tsx`: restyle as a compact toolbar with search, selects, tag filters, and clear action.
- Modify `frontend/src/modules/browser/components/BrowserListWidgets.tsx`: restyle batch toolbar and launch/CDP chips.
- Modify `frontend/src/modules/browser/components/BrowserProfilesPanel.tsx`: restyle table container, card mode, status/tags/actions, and scroll bounds.
- Modify `frontend/src/modules/browser/pages/BrowserListPage.tsx`: adjust outer spacing and pass any new header props.

---

### Task 1: Theme And Shared Primitive Density

**Files:**
- Modify: `frontend/src/shared/theme/themes/base.css`
- Modify: `frontend/src/shared/theme/themes/light.css`
- Modify: `frontend/src/shared/components/Button.tsx`
- Modify: `frontend/src/shared/components/Card.tsx`
- Modify: `frontend/src/shared/components/Table.tsx`

- [ ] **Step 1: Update the root theme aliases in `base.css`**

Replace the `:root` block in `frontend/src/shared/theme/themes/base.css` with:

```css
:root {
  --color-bg-base: #f5f6fa;
  --color-bg-surface: #ffffff;
  --color-bg-elevated: #ffffff;
  --color-bg-muted: #f5f6fa;
  --color-bg-subtle: #fafbfd;

  --color-bg-default: var(--color-bg-base);
  --color-bg-card: var(--color-bg-surface);
  --color-bg-primary: var(--color-bg-surface);
  --color-bg-secondary: var(--color-bg-muted);
  --color-bg-hover: var(--color-bg-muted);
  --color-bg-input: var(--color-bg-surface);

  --color-border-default: #e6e8f0;
  --color-border-muted: #f0f1f6;
  --color-border-strong: #c7cbe0;
  --color-border: var(--color-border-default);

  --color-text-primary: #14151f;
  --color-text-secondary: #6b7080;
  --color-text-muted: #9297a8;
  --color-text-inverse: #ffffff;

  --color-accent: #4b6eff;
  --color-accent-hover: #3d5ce8;
  --color-accent-muted: rgb(75 110 255 / 0.12);
  --color-primary: var(--color-accent);
  --color-surface-elevated: var(--color-bg-elevated);

  --color-success: #16c784;
  --color-warning: #f5a524;
  --color-error: #ef4757;
  --color-info: #4b6eff;

  --shadow-xs: 0 1px 2px 0 rgb(20 21 31 / 0.04);
  --shadow-sm: 0 1px 2px 0 rgb(20 21 31 / 0.06);
  --shadow-md: 0 8px 18px -12px rgb(20 21 31 / 0.22);
  --shadow-lg: 0 18px 36px -24px rgb(20 21 31 / 0.28);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.75rem;
}
```

- [ ] **Step 2: Update `light.css` to match the same fleet-console default**

Replace the `[data-theme='light']` block in `frontend/src/shared/theme/themes/light.css` with:

```css
[data-theme='light'] {
  --color-bg-base: #f5f6fa;
  --color-bg-surface: #ffffff;
  --color-bg-elevated: #ffffff;
  --color-bg-muted: #f5f6fa;
  --color-bg-subtle: #fafbfd;

  --color-border-default: #e6e8f0;
  --color-border-muted: #f0f1f6;
  --color-border-strong: #c7cbe0;

  --color-text-primary: #14151f;
  --color-text-secondary: #6b7080;
  --color-text-muted: #9297a8;
  --color-text-inverse: #ffffff;

  --color-accent: #4b6eff;
  --color-accent-hover: #3d5ce8;
  --color-accent-muted: rgb(75 110 255 / 0.12);

  --color-success: #16c784;
  --color-warning: #f5a524;
  --color-error: #ef4757;
  --color-info: #4b6eff;

  --shadow-sm: 0 1px 2px 0 rgb(20 21 31 / 0.06);
  --shadow-md: 0 8px 18px -12px rgb(20 21 31 / 0.22);
  --shadow-lg: 0 18px 36px -24px rgb(20 21 31 / 0.28);
}
```

- [ ] **Step 3: Tighten `Button.tsx` styles**

In `frontend/src/shared/components/Button.tsx`, update the constants to:

```tsx
const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none'

const variants = {
  primary: 'bg-[var(--color-accent)] text-[var(--color-text-inverse)] shadow-[0_1px_2px_rgb(75_110_255_/_0.25)] hover:bg-[var(--color-accent-hover)] focus-visible:ring-[var(--color-accent)]',
  secondary: 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)] focus-visible:ring-[var(--color-border-strong)]',
  danger: 'bg-[var(--color-error)] text-white hover:opacity-90 focus-visible:ring-[var(--color-error)]',
  ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
}
```

Keep the existing loading SVG and disabled logic.

- [ ] **Step 4: Tighten `Card.tsx` shell**

In `frontend/src/shared/components/Card.tsx`, replace the outer class list with:

```tsx
className={clsx(
  'bg-[var(--color-bg-surface)] rounded-[10px] overflow-hidden',
  'border border-[var(--color-border-default)]',
  'transition-all duration-150',
  hover && 'hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)]',
  className
)}
```

Change the header padding class from `px-5 py-4` to `px-4 py-3`.

- [ ] **Step 5: Update `Table.tsx` visual shell**

In `frontend/src/shared/components/Table.tsx`, change the wrapper and table classes to:

```tsx
<div
  className={clsx(
    'overflow-auto rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]',
    className
  )}
  style={{ maxHeight }}
>
  <table className="min-w-full border-collapse">
```

Change table header `th` classes to:

```tsx
'px-3.5 py-2.5 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.04em] bg-[var(--color-bg-subtle)] border-b border-[var(--color-border-default)]'
```

Change row hover and cell classes to:

```tsx
'hover:bg-[var(--color-bg-subtle)] transition-colors duration-150'
'px-3.5 py-3 text-[13px] text-[var(--color-text-secondary)]'
```

Keep sorting behavior, sticky header behavior, loading state, and empty state.

- [ ] **Step 6: Run a TypeScript build check**

Run:

```bash
cd frontend
npm run build
```

Expected: build either passes or fails only because later tasks have not yet been applied. If it fails from this task, fix the exact file reported before continuing.

- [ ] **Step 7: Checkpoint**

Run:

```bash
git diff -- frontend/src/shared/theme/themes/base.css frontend/src/shared/theme/themes/light.css frontend/src/shared/components/Button.tsx frontend/src/shared/components/Card.tsx frontend/src/shared/components/Table.tsx
```

Expected: diff only contains theme and shared primitive visual changes. Do not commit.

---

### Task 2: Fleet Console Sidebar

**Files:**
- Modify: `frontend/src/shared/layout/Sidebar.tsx`

- [ ] **Step 1: Update imports**

Ensure `Sidebar.tsx` imports `PanelLeftClose` and `PanelLeftOpen` from `lucide-react`, keeps `type LucideIcon`, and removes unused `ChevronLeft` and `ChevronRight`.

```tsx
import {
  Activity,
  Bookmark,
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  Monitor,
  Settings,
  Database,
  Layers,
  PieChart,
  Cpu,
  Globe,
  Bot,
  Puzzle,
  Tag,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
```

- [ ] **Step 2: Replace the component return with the fleet-console sidebar**

Inside `Sidebar`, keep:

```tsx
const location = useLocation();
const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
```

Replace the returned JSX with:

```tsx
return (
  <aside
    className={clsx(
      "flex shrink-0 flex-col bg-gradient-to-b from-[#12141c] to-[#181b26] text-[#c9cbdb] transition-[width] duration-200",
      sidebarCollapsed ? "w-16 px-2" : "w-56 px-3",
    )}
  >
    <div
      className={clsx(
        "flex h-[66px] items-center gap-2.5",
        sidebarCollapsed ? "justify-center" : "px-2",
      )}
    >
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4b6eff] to-[#7c5cff] text-[13px] font-bold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.14)]">
        AB
      </div>
      {!sidebarCollapsed && (
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold tracking-tight text-white">
            {projectConfig.name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6d7186]">
            Fleet Console
          </div>
        </div>
      )}
    </div>

    <nav className="flex-1 overflow-y-auto py-2">
      <div className="space-y-1">
        {navigationConfig.map((item, index) => {
          const Icon = getIcon(item.icon);
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
          const label = String(index + 1).padStart(2, "0");

          return (
            <Link
              key={item.path}
              to={item.path}
              title={sidebarCollapsed ? item.name : undefined}
              className={clsx(
                "group relative flex items-center rounded-lg border transition-colors duration-150",
                isActive
                  ? "border-white/10 bg-[#1f2333] text-white"
                  : "border-transparent text-[#a9acc0] hover:bg-white/[0.06] hover:text-[#e7e8f2]",
                sidebarCollapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-3 py-2.5",
              )}
            >
              {isActive && (
                <span className={clsx(
                  "absolute bottom-2 top-2 w-[3px] rounded-r bg-[var(--color-accent)]",
                  sidebarCollapsed ? "-left-2" : "-left-3",
                )} />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
              {!sidebarCollapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                    {item.name}
                  </span>
                  <span className={clsx(
                    "font-mono text-[9.5px]",
                    isActive ? "text-[#7c8dff]" : "text-[#5a5e73]",
                  )}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>

    <div className="py-3">
      <button
        type="button"
        onClick={toggleSidebar}
        className={clsx(
          "flex h-9 items-center rounded-lg text-[#8b8fa3] transition-colors hover:bg-white/[0.06] hover:text-[#e7e8f2]",
          sidebarCollapsed ? "mx-auto w-10 justify-center" : "w-full justify-center gap-2 px-3",
        )}
        title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-[18px] w-[18px]" />
        ) : (
          <>
            <PanelLeftClose className="h-[18px] w-[18px]" />
            <span className="text-sm">收起侧边栏</span>
          </>
        )}
      </button>
    </div>
  </aside>
);
```

- [ ] **Step 3: Remove the unused logo import**

Remove:

```tsx
import logoImage from "../../resources/images/logo.png";
```

The design uses the `AB` brand mark from the demo.

- [ ] **Step 4: Run build check**

Run:

```bash
cd frontend
npm run build
```

Expected: no unused imports and no TypeScript errors from `Sidebar.tsx`.

- [ ] **Step 5: Checkpoint**

Run:

```bash
git diff -- frontend/src/shared/layout/Sidebar.tsx
```

Expected: only sidebar visual and import changes. Do not commit.

---

### Task 3: Route-Aware Topbar And Shell Layout

**Files:**
- Modify: `frontend/src/shared/layout/Layout.tsx`
- Modify: `frontend/src/shared/layout/Topbar.tsx`

- [ ] **Step 1: Tighten `Layout.tsx`**

Replace the `Layout` return with:

```tsx
return (
  <div className="flex h-screen overflow-hidden bg-[var(--color-bg-base)]">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Topbar />
      <main className="min-w-0 flex-1 overflow-auto bg-[var(--color-bg-base)]">
        {children}
      </main>
    </div>
  </div>
);
```

- [ ] **Step 2: Add route context imports in `Topbar.tsx`**

Update imports to include:

```tsx
import { useLocation } from 'react-router-dom'
import { Bell, BookOpen, Check, Trash2, Info, AlertCircle, CheckCircle, Moon, Search } from 'lucide-react'
import { navigationConfig } from '../../config'
```

Keep existing React, `clsx`, store, and modal imports.

- [ ] **Step 3: Add route title helper above `Topbar`**

Add this function above `export function Topbar()`:

```tsx
function getRouteMeta(pathname: string) {
  const primary = navigationConfig.find((item) =>
    pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`)),
  )
  if (primary) return { title: primary.name, path: primary.path }
  if (pathname.startsWith('/browser/detail/')) return { title: '实例详情', path: pathname }
  if (pathname.startsWith('/browser/edit/')) return { title: '编辑实例', path: pathname }
  if (pathname.startsWith('/browser/copy/')) return { title: '复制实例', path: pathname }
  return { title: 'Ant Browser', path: pathname || '/' }
}
```

- [ ] **Step 4: Add location state inside `Topbar`**

At the start of `Topbar`, after state declarations, add:

```tsx
const location = useLocation()
const routeMeta = getRouteMeta(location.pathname)
```

- [ ] **Step 5: Replace the topbar `<header>` JSX**

Replace the top-level `<header>` element contents with:

```tsx
<header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-5">
  <div className="flex min-w-0 items-baseline gap-2">
    <div className="truncate text-[15px] font-bold text-[var(--color-text-primary)]">
      {routeMeta.title}
    </div>
    <div className="hidden truncate text-xs font-medium text-[var(--color-text-muted)] sm:block">
      {routeMeta.path}
    </div>
  </div>

  <button
    type="button"
    className="ml-auto hidden h-9 w-[260px] items-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-3 text-left text-[12.5px] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] lg:flex"
    title="搜索实例 / 分组 / 标签"
  >
    <Search className="h-3.5 w-3.5" />
    <span className="min-w-0 flex-1 truncate">搜索实例 / 分组 / 标签...</span>
    <span className="rounded border border-[var(--color-border-default)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)]">
      ⌘K
    </span>
  </button>

  <div className="flex items-center gap-1">
    <div className="relative" ref={dropdownRef}>
      {/* existing notification button and dropdown stay here */}
    </div>

    {/* existing docs button stays here */}

    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-secondary)]"
      title="主题"
    >
      <Moon className="h-4 w-4" />
    </button>

    <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#4b6eff] text-xs font-bold text-white">
      AB
    </div>
  </div>

  <DocsCenterModal open={docsOpen} onClose={() => setDocsOpen(false)} />
</header>
```

When applying the snippet, move the existing notification `<div className="relative" ref={dropdownRef}>...</div>` and docs button into the marked spots. Do not duplicate notification or docs logic.

- [ ] **Step 6: Run build check**

Run:

```bash
cd frontend
npm run build
```

Expected: `Topbar.tsx` has no JSX nesting or unused import errors.

- [ ] **Step 7: Checkpoint**

Run:

```bash
git diff -- frontend/src/shared/layout/Layout.tsx frontend/src/shared/layout/Topbar.tsx
```

Expected: route context and visual shell changes only. Do not commit.

---

### Task 4: Browser List Header, Stats, And Filters

**Files:**
- Modify: `frontend/src/modules/browser/components/BrowserListLayout.tsx`
- Modify: `frontend/src/modules/browser/components/InstanceFilterBar.tsx`
- Modify: `frontend/src/modules/browser/pages/BrowserListPage.tsx`

- [ ] **Step 1: Extend `BrowserListHeaderProps`**

In `BrowserListLayout.tsx`, add:

```tsx
errorProfileCount?: number
```

to `BrowserListHeaderProps`.

- [ ] **Step 2: Update `BrowserListHeader` signature and stat items**

Include `errorProfileCount = 0` in the props destructuring. Replace `statItems` with:

```tsx
const stoppedCount = Math.max(0, profileCount - runningCount)
const statItems = [
  { label: '实例总数', value: profileCount, tone: 'default' },
  { label: '运行中', value: runningCount, tone: 'success' },
  { label: '已停止', value: stoppedCount, tone: 'default' },
  { label: '代理异常', value: errorProfileCount, tone: 'error' },
] as const
```

- [ ] **Step 3: Replace the `BrowserListHeader` returned JSX**

Use this structure:

```tsx
return (
  <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="max-w-2xl text-[12.5px] leading-5 text-[var(--color-text-muted)]">
          管理全部浏览器配置与实例：启动、停止、代理切换、标签分组、批量操作。
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />刷新
        </Button>
        <Button variant="secondary" size="sm" onClick={onImportProfiles} loading={importingProfiles}>
          <Upload className="h-4 w-4" />导入 / 导出
        </Button>
        <Button variant="secondary" size="sm" onClick={onOpenBackup}>
          <Archive className="h-4 w-4" />备份
        </Button>
        <Link to="/browser/edit/new">
          <Button size="sm">
            <Play className="h-4 w-4" />新建配置
          </Button>
        </Link>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-3"
        >
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--color-text-muted)]">
            {item.tone === 'success' && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] shadow-[0_0_0_3px_rgb(22_199_132_/_0.14)]" />}
            <span>{item.label}</span>
          </div>
          <div className={clsx(
            "mt-1.5 text-2xl font-extrabold tracking-tight",
            item.tone === 'success' && "text-[var(--color-success)]",
            item.tone === 'error' && "text-[var(--color-error)]",
            item.tone === 'default' && "text-[var(--color-text-primary)]",
          )}>
            {item.value}
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <InstanceFilterBar
          filters={filters}
          onChange={onFiltersChange}
          proxies={proxies}
          cores={cores}
          allTags={allTags}
          groups={groups}
        />
        <div className="ml-auto flex items-center gap-2">
          {filteredProfileCount !== profileCount && (
            <span className="rounded-md bg-[var(--color-accent-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)]">
              筛选 {filteredProfileCount}
            </span>
          )}
          <div className="flex overflow-hidden rounded-md border border-[var(--color-border-default)]">
            <button
              className={clsx(
                "flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]",
                viewMode === 'card' && "bg-[var(--color-bg-muted)] text-[var(--color-accent)]",
              )}
              onClick={() => onViewModeChange('card')}
              title="卡片视图"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              className={clsx(
                "flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]",
                viewMode === 'table' && "bg-[var(--color-bg-muted)] text-[var(--color-accent)]",
              )}
              onClick={() => onViewModeChange('table')}
              title="表格视图"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)
```

Add `import clsx from 'clsx'` at the top of the file if it is not already present.

- [ ] **Step 4: Restyle `InstanceFilterBar` as inline toolbar content**

Replace the outer return in `InstanceFilterBar.tsx` with:

```tsx
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
        {hasFilter && (
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS, tags: new Set() })}
            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-error)]"
          >
            <X className="h-3.5 w-3.5" />
            清除
          </button>
        )}
        <div className="basis-full">
          <TagFilterBar tags={allTags} selected={filters.tags} onChange={tags => set('tags', tags)} />
        </div>
      </>
    )}
  </div>
)
```

- [ ] **Step 5: Adjust `BrowserListPage` outer shell**

Replace:

```tsx
<div className="overflow-auto p-5 space-y-5 animate-fade-in h-full">
```

with:

```tsx
<div className="h-full overflow-auto p-5 pb-10 animate-fade-in">
  <div className="space-y-4">
```

Add the matching closing `</div>` just before the existing outer closing `</div>`.

Pass `errorProfileCount={0}` to `BrowserListHeader` unless a reliable derived count is implemented in the same file.

- [ ] **Step 6: Run build check**

Run:

```bash
cd frontend
npm run build
```

Expected: JSX and prop types pass for `BrowserListHeader`, `InstanceFilterBar`, and `BrowserListPage`.

- [ ] **Step 7: Checkpoint**

Run:

```bash
git diff -- frontend/src/modules/browser/components/BrowserListLayout.tsx frontend/src/modules/browser/components/InstanceFilterBar.tsx frontend/src/modules/browser/pages/BrowserListPage.tsx
```

Expected: only list header/filter/shell changes. Do not commit.

---

### Task 5: Browser Profiles Panel, Batch Toolbar, And Row Details

**Files:**
- Modify: `frontend/src/modules/browser/components/BrowserProfilesPanel.tsx`
- Modify: `frontend/src/modules/browser/components/BrowserListWidgets.tsx`
- Modify: `frontend/src/shared/components/Badge.tsx`

- [ ] **Step 1: Make badges match the demo's pill density**

In `Badge.tsx`, update styles to:

```tsx
const variantStyles = {
  default: 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]',
  success: 'bg-[var(--color-success)]/12 text-[var(--color-success)] border border-[var(--color-success)]/20',
  error: 'bg-[var(--color-error)]/12 text-[var(--color-error)] border border-[var(--color-error)]/20',
  warning: 'bg-[var(--color-warning)]/12 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
  info: 'bg-[var(--color-accent)]/12 text-[var(--color-accent)] border border-[var(--color-accent)]/20',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10.5px]',
  md: 'px-2 py-0.5 text-[11px]',
  lg: 'px-2.5 py-1 text-xs',
}
```

Change the outer class from `rounded-full` to `rounded-md`.

- [ ] **Step 2: Restyle `BatchToolbar`**

In `BrowserListWidgets.tsx`, replace the returned toolbar class with:

```tsx
<div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)] px-3 py-2">
```

Change the selected count span to:

```tsx
<span className="text-xs font-semibold text-[var(--color-accent)]">已选 {selectedCount} / {totalCount}</span>
```

Keep the existing buttons and handlers.

- [ ] **Step 3: Tighten launch/CDP code chips**

In `LaunchCodeCell` and `CdpUrlCell`, replace chip classes with:

```tsx
className="rounded bg-[var(--color-bg-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-accent)]"
```

For truncated CDP chips, keep `max-w-[220px] truncate`.

- [ ] **Step 4: Restyle `BrowserProfileCard` shell**

In `BrowserProfilesPanel.tsx`, replace the card wrapper class in `BrowserProfileCard` with:

```tsx
className={`flex h-[300px] flex-col overflow-hidden rounded-[10px] border bg-[var(--color-bg-surface)] p-3 transition-colors duration-150
  ${isSelected ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20' : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]'}
`}
```

Change link text color in card and table profile names from accent to primary:

```tsx
className="text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)] hover:underline"
```

- [ ] **Step 5: Restyle table action buttons to icon-like controls**

In the table `actions` render, add compact width classes to icon-only buttons:

```tsx
<Button size="sm" variant="secondary" className="h-7 w-7 px-0" ...>
<Button size="sm" variant="ghost" className="h-7 w-7 px-0" ...>
```

For `ProfileMoreActions`, replace the trigger button with:

```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={onToggle}
  title="更多"
  disabled={disabled}
  className="h-7 w-7 px-0"
>
  <MoreHorizontal className="h-3.5 w-3.5" />
</Button>
```

- [ ] **Step 6: Remove nested table border duplication**

Because `Table.tsx` now provides its own border, change the `BrowserProfilesPanel` table wrapper from:

```tsx
return (
  <Card padding="none">
    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
```

to:

```tsx
return (
  <div className="rounded-[10px] bg-[var(--color-bg-surface)]">
    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
```

and replace the closing `</Card>` with `</div>`. Remove `Card` from the imports if it becomes unused.

- [ ] **Step 7: Run build check**

Run:

```bash
cd frontend
npm run build
```

Expected: no unused `Card` import and no JSX prop errors.

- [ ] **Step 8: Checkpoint**

Run:

```bash
git diff -- frontend/src/modules/browser/components/BrowserProfilesPanel.tsx frontend/src/modules/browser/components/BrowserListWidgets.tsx frontend/src/shared/components/Badge.tsx
```

Expected: only list panel, batch toolbar, code chip, badge, and action styling changes. Do not commit.

---

### Task 6: Browser QA And Final Verification

**Files:**
- No planned source modifications. Fix exact files reported by build or visual QA if verification finds regressions.

- [ ] **Step 1: Run full frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 2: Start the dev server**

Run:

```bash
cd frontend
npm run dev
```

Expected: the dev server prints a local URL. Keep it running for browser QA.

- [ ] **Step 3: Inspect `/browser/list` at desktop width**

Open the dev URL and navigate to `/browser/list`.

Expected:

- Deep fleet-console sidebar is visible.
- Active nav item has dark active background, left blue rail, icon, label, and number.
- Topbar shows page title, route path, search field, notification button, docs button, theme button, and avatar.
- Main surface is light gray.
- Instance list has intro text, stat cards, compact toolbar, and table/card view controls.
- No text overlaps at 1280px width.

- [ ] **Step 4: Inspect sidebar collapse behavior**

Click the sidebar collapse button.

Expected:

- Sidebar width collapses to icon-only.
- Navigation still routes correctly.
- Tooltip titles are present on icon-only items.
- Active rail remains visible.
- Expanding restores labels and indices.

- [ ] **Step 5: Inspect preserved interactions**

On `/browser/list`, verify:

- Status filter changes visible profiles.
- Keyword search changes visible profiles.
- Group/proxy/core filters update visible profiles.
- Tag filter still toggles tags.
- Table/card view toggle still switches panels.
- Selecting rows reveals the batch toolbar.
- Existing action buttons still call their handlers.

Use safe non-destructive checks for actions unless the local data is disposable. For destructive actions, verify the confirmation modal appears and cancel it.

- [ ] **Step 6: Inspect topbar modals**

Click notification and docs buttons.

Expected:

- Notification dropdown opens and closes.
- Docs center modal opens and closes.
- Existing read/clear notification controls still render.

- [ ] **Step 7: Spot-check non-target pages**

Navigate to:

- `/browser/proxy-pool`
- `/browser/cores`
- `/settings`

Expected:

- Pages inherit the new default theme without obvious broken spacing, invisible text, or overlapping controls.
- The redesign may make these pages visually closer to the new system, but should not require workflow changes.

- [ ] **Step 8: Final diff review**

Run:

```bash
git diff --stat
git diff -- frontend/src/shared frontend/src/modules/browser
```

Expected:

- Changes are limited to theme, shared primitives, shell layout, and browser list presentation.
- No backend files changed.
- No Wails generated bindings changed.
- `.superpowers/` remains untracked and uncommitted.
- `docs/superpowers/specs/...` and `docs/superpowers/plans/...` may be ignored by git; do not force-add or commit because the user requested no commits.
