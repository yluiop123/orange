import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MENU_TYPES, STATUS_ENABLE } from '../common/constants';
import { Permission } from '../entities/permission.entity';

export interface MenuInfo {
  id: string;
  path: string;
  type: string;
  name: string | null;
  children: MenuInfo[];
}

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  /**
   * Enabled `menu` / `directory` nodes ordered by code. Actions are excluded,
   * and a branch whose parent is disabled stays hidden instead of being
   * promoted to a root (the frontend filters visible pages itself).
   */
  async tree(): Promise<MenuInfo[]> {
    const rows = await this.permissions.find({
      where: { status: STATUS_ENABLE, type: In(MENU_TYPES) },
      order: { id: 'ASC' },
    });

    const nodes = new Map<string, MenuInfo>();
    for (const row of rows) {
      nodes.set(row.id, {
        id: row.id,
        path: row.path,
        type: row.type,
        name: row.name,
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
}
