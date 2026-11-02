# Backend menu tree, filesystem routes

The backend returns the full enabled menu tree at `GET /api/user/menus`. Each node carries `id`, `path`, `type`, `name` and nested `children`; the tree contains only `menu` and `directory` permissions. Sibling order is the code order (see ADR 0003). The frontend no longer keeps menu titles, ordering or hierarchy. It keeps one path-to-icon map and renders the tree in the sidebar and breadcrumb.

Menu visibility stays on the frontend. The backend returns the full tree because the structure is not user-specific and because the frontend already receives the user's permissions for role switching. A leaf is visible when a menu permission matches its path or a directory permission covers it; a container is visible when at least one child is visible. This keeps role switching a view filter and keeps direct URLs returning 403 instead of disappearing from the router.

Routes are not generated from the menu tree. Every non-special page under `src/pages/**/index.tsx` becomes a route automatically, and menu container paths get redirects once the tree is loaded. This way a menu service failure degrades the sidebar instead of blocking the whole application, and an unknown URL still resolves through the normal not-found and forbidden paths. The cost is that adding a page requires a page file and a menu permission; a consistency test enforces both directions.

Titles come from the database `name` column, not from locale messages. The trade-off is accepted: an English locale shows the database menu names, but the menu has one source of truth and no per-menu translation table.

No database columns were added. Icons are mapped by page path on the frontend, with `Folder` for unknown directories and `Circle` for unknown menus. Enabled menu nodes whose parent is disabled or missing are promoted to roots with a warning log instead of being silently dropped.
