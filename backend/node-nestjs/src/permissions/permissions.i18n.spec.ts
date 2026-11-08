import 'reflect-metadata';
import type { DataSource, Repository } from 'typeorm';
import type { PermissionI18n } from '../entities/permission-i18n.entity';
import type { Permission } from '../entities/permission.entity';
import type { MenusService } from '../menus/menus.service';
import type { PermissionsService } from './permissions.service';

describe('permission translations', () => {
  const originalDriver = process.env.DB_DRIVER;
  let dataSource: DataSource;
  let permissions: Repository<Permission>;
  let translations: Repository<PermissionI18n>;
  let service: PermissionsService;
  let menus: MenusService;

  beforeAll(async () => {
    // Entity column types are resolved when the decorators run, so the driver
    // must be selected before the entity modules are imported.
    process.env.DB_DRIVER = 'sqlite';

    const { DataSource: DataSourceImpl } = await import('typeorm');
    const { Permission: PermissionEntity } = await import('../entities/permission.entity');
    const { PermissionI18n: PermissionI18nEntity } = await import(
      '../entities/permission-i18n.entity'
    );
    const { Role } = await import('../entities/role.entity');
    const { User } = await import('../entities/user.entity');
    const { PermissionsService: PermissionsServiceImpl } = await import(
      './permissions.service'
    );
    const { MenusService: MenusServiceImpl } = await import('../menus/menus.service');

    dataSource = new DataSourceImpl({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [PermissionEntity, PermissionI18nEntity, Role, User],
      synchronize: true,
    });
    await dataSource.initialize();

    permissions = dataSource.getRepository(PermissionEntity);
    translations = dataSource.getRepository(PermissionI18nEntity);
    service = new PermissionsServiceImpl(
      permissions,
      dataSource.getRepository(Role),
      dataSource.getRepository(User),
      translations,
    );
    menus = new MenusServiceImpl(permissions, translations);
  });

  afterAll(async () => {
    await dataSource?.destroy();
    restoreEnv('DB_DRIVER', originalDriver);
  });

  beforeEach(async () => {
    await translations.clear();
    await permissions.clear();
  });

  async function seedRoot(): Promise<void> {
    await service.addChild({
      id: '0001',
      name: '系统管理',
      path: '/system',
      type: 'directory',
      translations: { 'en-US': 'System management', en: 'System' },
    });
  }

  it('inserts translations on create and returns them from get and list', async () => {
    await seedRoot();

    expect(await translations.count()).toBe(2);

    const fetched = await service.get('0001');
    expect(fetched.name).toBe('系统管理');
    expect(fetched.translations).toEqual({ 'en-US': 'System management', en: 'System' });

    const [listed] = await service.list({});
    expect(listed.translations).toEqual({ 'en-US': 'System management', en: 'System' });
  });

  it('returns an empty translations object when a permission has none', async () => {
    await service.addChild({ id: '0001', name: '系统管理', path: '/system', type: 'directory' });

    expect((await service.get('0001')).translations).toEqual({});
  });

  it('replaces all rows when edit provides translations', async () => {
    await seedRoot();

    await service.edit('0001', { translations: { 'zh-CN': '系统管理' } });

    expect((await service.get('0001')).translations).toEqual({ 'zh-CN': '系统管理' });
    expect(await translations.count()).toBe(1);
  });

  it('keeps translations when edit omits them and clears them for an empty object', async () => {
    await seedRoot();

    await service.edit('0001', { name: '系统管理二' });
    expect((await service.get('0001')).translations).toEqual({
      'en-US': 'System management',
      en: 'System',
    });

    await service.edit('0001', { translations: {} });
    expect((await service.get('0001')).translations).toEqual({});
    expect(await translations.count()).toBe(0);
  });

  it('deletes translation rows together with the permission subtree', async () => {
    await seedRoot();
    await service.addChild({
      id: '000101',
      name: '用户管理',
      path: '/system/user',
      type: 'menu',
      parentId: '0001',
      translations: { en: 'User management' },
    });
    expect(await translations.count()).toBe(3);

    await service.remove(['0001']);

    expect(await permissions.count()).toBe(0);
    expect(await translations.count()).toBe(0);
  });

  it('localizes menu names by exact locale, then language, then default name', async () => {
    await seedRoot();
    await service.addChild({
      id: '000101',
      name: '用户管理',
      path: '/system/user',
      type: 'menu',
      parentId: '0001',
      translations: { en: 'User management' },
    });

    const exact = await menus.tree('en-US');
    expect(exact[0].name).toBe('System management');
    expect(exact[0].children[0].name).toBe('User management');

    const language = await menus.tree('en-GB');
    expect(language[0].name).toBe('System');
    expect(language[0].children[0].name).toBe('User management');

    const fallback = await menus.tree('fr-FR');
    expect(fallback[0].name).toBe('系统管理');
    expect(fallback[0].children[0].name).toBe('用户管理');

    const noHeader = await menus.tree();
    expect(noHeader[0].name).toBe('系统管理');
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
