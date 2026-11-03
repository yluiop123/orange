import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BusinessException } from '../common/business-exception';
import { STATUS_ALL, STATUS_DISABLE, STATUS_ENABLE } from '../common/constants';
import { toIso } from '../common/page';
import { likePrefix, LIKE_ESCAPE } from '../common/query.util';
import { TreeCodePolicy, trimToNull } from '../common/tree-code.policy';
import { TreeIndex } from '../common/tree-index';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { AddChildGroupDto, EditGroupDto, QueryGroupDto } from './groups.dto';

export interface GroupBean {
  id: string;
  name: string | null;
  status: string;
  parentId: string | null;
  createTime: string | null;
  updateTime: string | null;
}

export function toGroupBean(group: Group): GroupBean {
  return {
    id: group.id,
    name: group.name,
    status: group.status,
    parentId: group.parentId,
    createTime: toIso(group.createTime),
    updateTime: toIso(group.updateTime),
  };
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groups: Repository<Group>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(query: QueryGroupDto): Promise<GroupBean[]> {
    const builder = this.groups.createQueryBuilder('g');
    if (isNotBlank(query.id)) {
      builder.andWhere(`LOWER(g.id) LIKE :id ${LIKE_ESCAPE}`, { id: likePrefix(query.id) });
    }
    if (isNotBlank(query.name)) {
      builder.andWhere(`LOWER(g.name) LIKE :name ${LIKE_ESCAPE}`, { name: likePrefix(query.name) });
    }
    if (isNotBlank(query.status) && query.status !== STATUS_ALL) {
      builder.andWhere('g.status = :status', { status: query.status });
    }
    builder.orderBy('g.id', 'ASC');

    const matched = await builder.getMany();
    const textFilter = isNotBlank(query.id) || isNotBlank(query.name);
    const result = textFilter ? await this.includeAncestors(matched) : matched;
    return result.map(toGroupBean);
  }

  async get(id: string): Promise<GroupBean> {
    return toGroupBean(await this.requireGroup(id));
  }

  async edit(id: string, dto: EditGroupDto): Promise<void> {
    const group = await this.requireGroup(id);
    if (dto.name !== undefined) {
      group.name = dto.name;
    }
    if (dto.status !== undefined) {
      await this.applyStatus(group, dto.status);
    }
    await this.groups.save(group);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const group = await this.requireGroup(id);
    await this.applyStatus(group, status);
    await this.groups.save(group);
  }

  async addChild(dto: AddChildGroupDto): Promise<GroupBean> {
    const id = dto.id;
    const parentId = trimToNull(dto.parentId);
    TreeCodePolicy.GROUP.validate(id, parentId);

    if (await this.groups.existsBy({ id })) {
      throw BusinessException.conflict('组织编码已存在');
    }
    if (parentId !== null && !(await this.groups.existsBy({ id: parentId }))) {
      throw BusinessException.notFound('父组织不存在');
    }

    const group = this.groups.create({
      id,
      name: dto.name,
      parentId,
      status: STATUS_ENABLE,
    });
    return toGroupBean(await this.groups.save(group));
  }

  async remove(ids: string[]): Promise<void> {
    const requested = [...new Set(ids)];
    if (requested.length === 0) {
      throw BusinessException.notFound('组织不存在');
    }

    await this.groups.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Group);
      const all = await repository.find();
      const index = new TreeIndex(all, (group) => group.id, (group) => group.parentId);

      for (const id of requested) {
        if (!index.get(id)) {
          throw BusinessException.notFound('组织不存在');
        }
      }

      const subtree = index.subtreeIds(requested);
      const userCount = await manager.getRepository(User).count({
        where: { groupId: In([...subtree]) },
      });
      if (userCount > 0) {
        throw BusinessException.conflict('组织或其子组织下有用户，不能删除');
      }

      // Deepest first: a selected parent and child must not race the FK.
      for (const group of index.deleteOrder(subtree)) {
        await repository.delete({ id: group.id });
      }
    });
  }

  private async requireGroup(id: string): Promise<Group> {
    const group = await this.groups.findOneBy({ id });
    if (!group) {
      throw BusinessException.notFound('组织不存在');
    }
    return group;
  }

  private async applyStatus(group: Group, status: string): Promise<void> {
    const disabling = group.status !== STATUS_DISABLE && status === STATUS_DISABLE;
    if (disabling) {
      await this.assertNoEnabledDescendants(group.id);
    }
    group.status = status;
  }

  /** Text filters also return ancestors so the frontend keeps the tree shape. */
  private async includeAncestors(matched: Group[]): Promise<Group[]> {
    const all = await this.groups.find({ order: { id: 'ASC' } });
    const index = new TreeIndex(all, (group) => group.id, (group) => group.parentId);
    const ids = index.withAncestorIds(matched);
    return all.filter((group) => ids.has(group.id));
  }

  /** Disabling a parent requires all descendants to be disabled first. */
  private async assertNoEnabledDescendants(id: string): Promise<void> {
    const all = await this.groups.find();
    const index = new TreeIndex(all, (group) => group.id, (group) => group.parentId);
    if (index.hasEnabledDescendant(id, (group) => group.status === STATUS_ENABLE)) {
      throw BusinessException.validate('请先禁用子组织');
    }
  }
}

function isNotBlank(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
