import axios from "@/lib/axios";
import type { Status } from "@/lib/status";
import type { PageResult } from "../types";
import type { components } from "../schema";

export type Role = components["schemas"]["RoleBean"] & {
  id: string;
  name: string;
  status: Status;
};

export type RoleQuery = components["schemas"]["QueryRoleReq"] & {
  page: number;
  size: number;
  direction?: "asc" | "desc";
};

export type RolePayload = Partial<
  components["schemas"]["AddRoleReq"] & components["schemas"]["EditRoleReq"]
> & {
  name: string;
  status?: Status;
};

export async function listRoles(params: RoleQuery, signal?: AbortSignal) {
  const res = await axios.get<{ data: PageResult<Role> }>("/system/roles", {
    params,
    signal,
  });
  return res.data.data;
}

export async function getRole(id: string) {
  const res = await axios.get<{ data: Role }>(`/system/roles/${id}`);
  return res.data.data;
}

export async function createRole(payload: RolePayload) {
  const res = await axios.post<{ data: string }>("/system/roles", payload);
  return res.data.data;
}

export async function updateRole(id: string, payload: Partial<RolePayload>) {
  await axios.patch(`/system/roles/${id}`, { ...payload, id });
}

export async function deleteRoles(ids: string[]) {
  if (ids.length === 0) return;
  await axios.delete("/system/roles", { params: { ids: ids.join(",") } });
}
