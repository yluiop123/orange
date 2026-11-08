import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MENU_TYPES, STATUS_ENABLE } from '../common/constants';
import { PermissionI18n } from '../entities/permission-i18n.entity';
import { Permission } from '../entities/permission.entity';

export interface MenuInfo {
  id: string;
  path: string;
  type: string;
  name: string | null;
  children: MenuInfo[];
}

/**
 * Picks a display name for one menu node. Resolution order is the requested
 * locale (case-insensitive), then its language subtag (`en-US` -> `en`), then
 * the default `sys_permission.name`.
 */
export function resolveMenuName(
  fallback: string | null,
  translations: Map<string, string> | undefined,
  locale?: string,
): string | null {
  const requested = (locale ?? '').trim().toLowerCase();
  if (!translations || translations.size === 0 || requested.length === 0) {
    return fallback;
  }

  const exact = translations.get(requested);
  if (exact && exact.trim().length > 0) {
    return exact;
  }

  const separator = requested.indexOf('-');
  if (separator > 0) {
    const language = translations.get(requested.slice(0, separator));
    if (language && language.trim().length > 0) {
      return language;
    }
  }
  return fallback;
}

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(PermissionI18n)
    private readonly translations: Repository<PermissionI18n>,
  ) {}

  /**
   * Enabled `menu` / `directory` nodes ordered by code. Actions are excluded,
   * and a branch whose parent is disabled stays hidden instead of being
   * promoted to a root (the frontend filters visible pages itself).
   */
  async tree(locale?: string): Promise<MenuInfo[]> {
    const rows = await this.permissions.find({
      where: { status: STATUS_ENABLE, type: In(MENU_TYPES) },
      order: { id: 'ASC' },
    });

    const localized = await this.loadTranslations(rows.map((row) => row.id));
    const nodes = new Map<string, MenuInfo>();
    for (const row of rows) {
      nodes.set(row.id, {
        id: row.id,
        path: row.path,
        type: row.type,
        name: resolveMenuName(row.name, localized.get(row.id), locale),
        children: [],
      });
    }

    const roots: MenuInfo[] = [];
    for (const row of rows) {
      const node = nodes.get(row.id) as MenuInfo;
      const parentId = row.parentId?.trim();
      if (!parentId) {
        roots.push(node);
        continue;
      }
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
    return roots;
  }

  private async loadTranslations(ids: string[]): Promise<Map<string, Map<string, string>>> {
    const byPermission = new Map<string, Map<string, string>>();
    if (ids.length === 0) {
      return byPermission;
    }
    const rows = await this.translations.find({
      where: { permissionId: In([...new Set(ids)]) },
    });
    for (const row of rows) {
      let byLocale = byPermission.get(row.permissionId);
      if (!byLocale) {
        byLocale = new Map<string, string>();
        byPermission.set(row.permissionId, byLocale);
      }
      byLocale.set(row.locale.toLowerCase(), row.name);
    }
    return byPermission;
  }
}
