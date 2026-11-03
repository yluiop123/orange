/**
 * 权限类型与 action 的组合规则（与后端 ValidatePermissionShape 一致）：
 * - action 类型必须填写 action
 * - menu / directory 类型不能填写 action
 * 返回语义化 issue，由表单或 mock 决定文案。
 */
export type PermissionShapeIssue = "action-required" | "action-forbidden";

export function checkPermissionShape(
  type?: string | null,
  action?: string | null,
): PermissionShapeIssue | null {
  const value = action?.trim() ?? "";
  if (type === "action") {
    return value === "" ? "action-required" : null;
  }
  return value === "" ? null : "action-forbidden";
}

export function permissionShapeMessageKey(
  issue: PermissionShapeIssue,
): string {
  return issue === "action-required"
    ? "validate.permissionAction.required"
    : "validate.permissionAction.forbidden";
}
