import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(root, "vite-shadcn/src/config/permissions.json");
const dmlPath = path.join(root, "database/postgres/dml.sql");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function renderPermissions() {
  const rows = catalog.permissions.map((permission) => {
    const values = [
      quote(permission.id),
      quote(permission.name.zh),
      quote(permission.path),
      quote(permission.action),
      quote(permission.type),
      quote(permission.status ?? "1"),
      quote(permission.parentId),
      String(permission.order ?? 0),
    ];
    return `\t (${values.join(",")})`;
  });
  return [
    "INSERT INTO public.sys_permission (id,\"name\",\"path\",\"action\",\"type\",status,parent_id,order_num) VALUES",
    rows.join(",\n") + ";",
  ].join("\n");
}

function renderRolePermissions() {
  const rows = [];
  for (const [role, permissions] of Object.entries(catalog.rolePermissions)) {
    for (const permission of permissions) {
      rows.push(`\t (${quote(role)},${quote(permission)})`);
    }
  }
  return [
    "INSERT INTO public.sys_role_permission (role_id,permission_id) VALUES",
    rows.join(",\n") + ";",
  ].join("\n");
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

let dml = fs.readFileSync(dmlPath, "utf8");

// 首次运行时给现有 INSERT 加上生成标记
if (!dml.includes("-- BEGIN GENERATED PERMISSIONS")) {
  dml = dml.replace(
    /INSERT INTO public\.sys_permission[\s\S]*?;/,
    (block) => `-- BEGIN GENERATED PERMISSIONS\n${block}\n-- END GENERATED PERMISSIONS`,
  );
}
if (!dml.includes("-- BEGIN GENERATED ROLE_PERMISSIONS")) {
  dml = dml.replace(
    /INSERT INTO public\.sys_role_permission[\s\S]*?;/,
    (block) => `-- BEGIN GENERATED ROLE_PERMISSIONS\n${block}\n-- END GENERATED ROLE_PERMISSIONS`,
  );
}

const next = replaceBlock(
  replaceBlock(dml, "PERMISSIONS", renderPermissions()),
  "ROLE_PERMISSIONS",
  renderRolePermissions(),
);

const check = process.argv.includes("--check");
if (check) {
  if (next !== dml) {
    console.error("permission seed is out of date; run `pnpm db:seed`");
    process.exit(1);
  }
  console.log("permission seed is up to date");
} else {
  fs.writeFileSync(dmlPath, next, "utf8");
  console.log(
    `permission seed synced: ${catalog.permissions.length} permissions, ` +
      `${Object.values(catalog.rolePermissions).flat().length} grants`,
  );
}
