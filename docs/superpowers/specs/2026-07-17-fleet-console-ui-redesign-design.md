# Fleet Console UI Redesign Design

Date: 2026-07-17

## Goal

Refactor Ant Browser's default interface using the provided `demo.html` as the visual target. The redesign should make the application feel like a compact fleet-management console while keeping existing browser-profile business behavior intact.

## Scope

This design covers:

- The default light theme.
- The application shell: sidebar, topbar, main content surface, and shared visual density.
- The browser instance list page.
- Small visual updates to shared primitives needed by the shell and list page, including buttons, cards, and tables.

This design does not cover:

- Rebuilding all eight primary pages.
- Adding a global command palette behind the search entry.
- Changing backend APIs, routes, persistence, launch behavior, proxy behavior, import/export behavior, backup behavior, or notification behavior.

## Design Direction

Use the demo's high-fidelity fleet-console visual language as the default experience:

- Dark gradient sidebar with compact navigation.
- Ant Browser brand block with an `AB` mark and `FLEET CONSOLE` subtitle.
- Two-digit navigation indices.
- White topbar with current page title, route path, search entry, documentation, notifications, theme affordance, and avatar area.
- Light gray workspace background.
- White panels with cool gray borders.
- Blue-purple accent color.
- Compact 8-10px radius controls.
- Dense tables with uppercase muted headers and clear row hover states.

The implementation should integrate this direction into the existing React/Wails codebase instead of pasting the static demo HTML.

## Architecture

The redesign should follow a theme-first approach.

The default light theme will be updated to define the new visual foundation: background, surfaces, borders, muted text, accent colors, semantic status colors, and shadows. Shared components will consume these variables so the rest of the app moves closer to the new style without page-by-page rewrites.

The shell components will keep their current responsibilities:

- `Layout.tsx` owns the main two-column app structure.
- `Sidebar.tsx` renders navigation from `navigationConfig` and uses `useLayoutStore` for collapsed state.
- `Topbar.tsx` owns notifications and the docs-center modal.

The browser list page will keep its current data hooks and actions, but its presentation will be reorganized around the demo's information hierarchy.

## Component Design

### Theme

Update `frontend/src/shared/theme/themes/light.css` so the default light theme matches the demo:

- Base background: near `#f5f6fa`.
- Surface/elevated surfaces: white.
- Borders: cool gray around `#e6e8f0`.
- Primary text: near black.
- Secondary and muted text: gray-blue.
- Accent: `#4b6eff`, with a muted translucent variant.
- Success, warning, and error colors should stay distinct and readable.

### Layout

Keep `Layout.tsx` structurally simple. Adjust the main area to use the new workspace background and tighter content padding. The app remains a full-height desktop layout with independently scrollable main content.

### Sidebar

Rewrite the sidebar's visual layer while preserving routing behavior:

- Width: about 224-240px expanded and about 64px collapsed.
- Brand area: `AB` mark, `Ant Browser`, `FLEET CONSOLE`.
- Navigation items: lucide icon, label, and a two-digit index when expanded.
- Active item: darker active background, subtle border, and a left accent rail.
- Collapsed state: icon-only navigation with tooltip titles.
- Collapse control remains at the bottom.

### Topbar

Enhance `Topbar.tsx` with page context while preserving current behavior:

- Derive current title and path from `navigationConfig` and the current pathname.
- Show title and path on the left.
- Add a styled search entry that visually matches the demo. This is a visual entry only in this phase.
- Keep the existing notifications dropdown.
- Keep the existing docs-center modal.
- Add room for theme/avatar affordances without introducing new business logic.

### Shared Components

Apply small visual convergence to shared primitives:

- `Button.tsx`: compact sizing, 8px radius, accent primary, bordered secondary, ghost hover states.
- `Card.tsx`: 8-10px radius, white surface, cool border, restrained shadow only on hover when requested.
- `Table.tsx`: white surface, muted uppercase header, denser row padding, clear hover state, sticky header behavior preserved.

These changes should be conservative because non-target pages also use these components.

### Browser List Page

Refactor the list page presentation around the demo's hierarchy:

- Page intro row with short descriptive text and primary actions.
- Four stat cards:
  - Total profiles.
  - Running profiles.
  - Stopped profiles.
  - Proxy/error-related count when available. If reliable data is not available, use a conservative derived value or omit the metric rather than inventing data.
- Filter toolbar with compact chips/selectors for status, group, tag, proxy, and core filters.
- View-mode segmented control for table/card modes.
- Batch actions remain available and respect current selected profiles.
- Instance table keeps existing columns and action behavior, with denser row styling, clearer statuses, tags, and icon action buttons.

## Data Flow

No data-flow changes are required.

The browser list continues to use:

- `useBrowserListData` for profiles, proxies, cores, groups, loading state, and refresh behavior.
- `useBrowserListViewState` and `InstanceFilterBar` for filters and view mode.
- `useBrowserListDerived` for counts, filtered profiles, status, and core labels.
- `useBrowserProfileActions` and existing API functions for start, stop, restart, import, export, backup, copy, edit, delete, proxy picking, and extension management.

The topbar's route context is derived client-side from the current pathname and `navigationConfig`.

## Error Handling

The redesign must preserve existing error handling:

- Frontend global errors still create notifications.
- Browser crash events still create notifications.
- Start/stop/import/export/backup failures still use current toast and modal flows.
- Loading and empty states remain visible.
- Notification dropdown read/clear behavior remains unchanged.

Any new visual states should be presentational only and must not add new failure modes.

## Testing And Verification

Verification should include:

- Run the frontend build with `npm run build`.
- Start the frontend dev server and inspect the UI in a browser.
- Check the shell on the browser list page:
  - Sidebar expanded and collapsed states.
  - Active navigation state.
  - Topbar title/path, search entry, docs-center modal, and notification dropdown.
  - Main content scroll behavior.
- Check the browser list page:
  - Stat cards render from real data.
  - Filters still change visible rows.
  - Table/card view switching still works.
  - Batch actions still respect selected profiles.
  - Start/stop/restart/edit/copy/proxy/extension actions remain wired.
- Spot-check non-target pages such as proxy pool, core management, and settings to ensure theme changes do not create obvious layout breakage.

## Acceptance Criteria

- The default app shell and browser list page visually align with the provided demo.
- The default light theme is replaced by the new fleet-console visual foundation.
- Existing navigation and browser-profile workflows continue to work.
- No backend API or route changes are introduced.
- The implementation builds successfully.
- Temporary brainstorming companion files under `.superpowers/` are not committed.
