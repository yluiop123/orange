import axios from "@/lib/axios";

export type Permission = {
  id: string;
  name: string;
  path?: string;
  action?: string;
  type?: "menu" | "action" | "directory";
  status?: "0" | "1";
  parentId?: string | null;
  order?: number;
  createTime?: string;
  updateTime?: string;
};

export type PermissionQuery = {
  id?: string;
  name?: string;
  path?: string;
  status?: string;
};

export type PermissionPayload = {
  id?: string;
  name?: string;
  path?: string;
  action?: string;
  type?: "menu" | "action" | "directory";
  status?: "0" | "1";
  parentId?: string;
};

export type MoveAction = "up" | "down" | "top";

export async function listPermissions(
  params?: PermissionQuery,
  signal?: AbortSignal,
) {
  const res = await axios.get<{ data: Permission[] }>("/system/permissions", {
    params,
    signal,
  });
  return res.data.data;
}

export async function getPermission(id: string) {
  const res = await axios.get<{ data: Permission }>(
    `/system/permissions/${id}`,
  );
  return res.data.data;
}

export async function updatePermission(
  id: string,
  payload: PermissionPayload,
) {
  await axios.patch(`/system/permissions/${id}`, { ...payload, id });
}

export async function addPermissionChild(payload: {
  id: string;
  name: string;
  path: string;
  type: "menu" | "action" | "directory";
  action?: string;
  parentId?: string;
}) {
  await axios.post("/system/permissions/children", payload);
}

export async function addPermissionSibling(payload: {
  id: string;
  name: string;
  path: string;
  type: "menu" | "action" | "directory";
  action?: string;
  brotherId: string;
}) {
  await axios.post("/system/permissions/siblings", payload);
}

export async function movePermission(id: string, action: MoveAction) {
  await axios.post(`/system/permissions/${id}/move`, { action });
}

export async function deletePermissions(ids: string[]) {
  if (ids.length === 0) return;
  await axios.delete("/system/permissions", {
    params: { ids: ids.join(",") },
  });
}
