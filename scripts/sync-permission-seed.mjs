import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(root, "database/permissions.json");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

/**
 * Every dialect ships the same generated seed. Only the identifier quoting and
 * the schema prefix differ; keeping them in one place stops the seven dml.sql
 * files from drifting apart.
 */
const DIALECTS = {
  postgres: {
    permission:
      'INSERT INTO public.sys_permission (id,"name","path","action","type",status,parent_id) VALUES',
    permissionI18n:
      'INSERT INTO public.sys_permission_i18n (permission_id, locale, "name") VALUES',
    rolePermission: "INSERT INTO public.sys_role_permission (role_id,permission_id) VALUES",
  },
  opengauss: {
    permission:
      'INSERT INTO public.sys_permission (id,"name","path","action","type",status,parent_id) VALUES',
    permissionI18n:
      'INSERT INTO public.sys_permission_i18n (permission_id, locale, "name") VALUES',
    rolePermission: "INSERT INTO public.sys_role_permission (role_id,permission_id) VALUES",
  },
  sqlite: {
    permission:
      'INSERT INTO sys_permission (id,"name","path","action","type",status,parent_id) VALUES',
    permissionI18n: 'INSERT INTO sys_permission_i18n (permission_id, locale, "name") VALUES',
    rolePermission: "INSERT INTO sys_role_permission (role_id,permission_id) VALUES",
  },
  mysql: {
    permission:
      "INSERT INTO `sys_permission` (`id`,`name`,`path`,`action`,`type`,`status`,`parent_id`) VALUES",
    permissionI18n:
      "INSERT INTO `sys_permission_i18n` (`permission_id`,`locale`,`name`) VALUES",
    rolePermission: "INSERT INTO `sys_role_permission` (`role_id`,`permission_id`) VALUES",
  },
  mariadb: {
    permission:
      "INSERT INTO `sys_permission` (`id`,`name`,`path`,`action`,`type`,`status`,`parent_id`) VALUES",
    permissionI18n:
      "INSERT INTO `sys_permission_i18n` (`permission_id`,`locale`,`name`) VALUES",
    rolePermission: "INSERT INTO `sys_role_permission` (`role_id`,`permission_id`) VALUES",
  },
  oceanbase: {
    permission:
      "INSERT INTO `sys_permission` (`id`,`name`,`path`,`action`,`type`,`status`,`parent_id`) VALUES",
    permissionI18n:
      "INSERT INTO `sys_permission_i18n` (`permission_id`,`locale`,`name`) VALUES",
    rolePermission: "INSERT INTO `sys_role_permission` (`role_id`,`permission_id`) VALUES",
  },
  goldendb: {
    permission:
      "INSERT INTO `sys_permission` (`id`,`name`,`path`,`action`,`type`,`status`,`parent_id`) VALUES",
    permissionI18n:
      "INSERT INTO `sys_permission_i18n` (`permission_id`,`locale`,`name`) VALUES",
    rolePermission: "INSERT INTO `sys_role_permission` (`role_id`,`permission_id`) VALUES",
  },
};

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function renderPermissions(dialect) {
  const rows = catalog.permissions.map((permission) => {
    const values = [
      quote(permission.id),
      quote(permission.name.zh),
      quote(permission.path),
      quote(permission.action),
      quote(permission.type),
      quote(permission.status ?? "1"),
      quote(permission.parentId),
    ];
    return `\t (${values.join(",")})`;
  });
  return [`${DIALECTS[dialect].permission}`, rows.join(",\n") + ";"].join("\n");
}

function renderPermissionI18n(dialect) {
  const rows = [];
  for (const permission of catalog.permissions) {
    for (const [locale, name] of Object.entries(permission.name)) {
      rows.push(`\t (${quote(permission.id)},${quote(locale)},${quote(name)})`);
    }
  }
  return [`${DIALECTS[dialect].permissionI18n}`, rows.join(",\n") + ";"].join("\n");
}

function renderRolePermissions(dialect) {
  const rows = [];
  for (const [role, permissions] of Object.entries(catalog.rolePermissions)) {
    for (const permission of permissions) {
      rows.push(`\t (${quote(role)},${quote(permission)})`);
    }
  }
  return [`${DIALECTS[dialect].rolePermission}`, rows.join(",\n") + ";"].join("\n");
}

function replaceBlock(source, name, content) {
  const begin = `-- BEGIN GENERATED ${name}`;
  const end = `-- END GENERATED ${name}`;
  const pattern = new RegExp(`${begin}[\\s\\S]*?${end}`);
  if (!pattern.test(source)) {
    throw new Error(`Missing generated block markers for ${name}`);
  }
  return source.replace(pattern, `${begin}\n${content}\n${end}`);
}

function withMarkers(source) {
  let next = source;
  if (!next.includes("-- BEGIN GENERATED PERMISSIONS")) {
    next = next.replace(
      /INSERT INTO (?:public\.)?[`"]?sys_permission[`"]?[\s\S]*?;/,
      (block) => `-- BEGIN GENERATED PERMISSIONS\n${block}\n-- END GENERATED PERMISSIONS`,
    );
  }
  if (!next.includes("-- BEGIN GENERATED PERMISSION_I18N")) {
    next = next.replace(
      "-- END GENERATED PERMISSIONS",
      "-- END GENERATED PERMISSIONS\n-- BEGIN GENERATED PERMISSION_I18N\n-- END GENERATED PERMISSION_I18N",
    );
  }
  if (!next.includes("-- BEGIN GENERATED ROLE_PERMISSIONS")) {
    next = next.replace(
      /INSERT INTO (?:public\.)?[`"]?sys_role_permission[`"]?[\s\S]*?;/,
      (block) => `-- BEGIN GENERATED ROLE_PERMISSIONS\n${block}\n-- END GENERATED ROLE_PERMISSIONS`,
    );
  }
  return next;
}

let updated = 0;

for (const dialect of Object.keys(DIALECTS)) {
  const dmlPath = path.join(root, `database/${dialect}/dml.sql`);
  const source = fs.readFileSync(dmlPath, "utf8");
  const next = replaceBlock(
    replaceBlock(
      replaceBlock(
        withMarkers(source),
        "PERMISSIONS",
        renderPermissions(dialect),
      ),
      "PERMISSION_I18N",
      renderPermissionI18n(dialect),
    ),
    "ROLE_PERMISSIONS",
    renderRolePermissions(dialect),
  );
  if (next === source) continue;
  fs.writeFileSync(dmlPath, next, "utf8");
  updated += 1;
}

const translations = catalog.permissions.reduce(
  (total, permission) => total + Object.keys(permission.name).length,
  0,
);
const grants = Object.values(catalog.rolePermissions).flat().length;
console.log(
  `permission seed synced in ${updated} dialect(s): ${catalog.permissions.length} permissions, ` +
    `${translations} translations, ${grants} grants`,
);
