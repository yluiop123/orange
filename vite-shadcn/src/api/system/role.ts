import axios from "@/lib/axios";
import type { PageResult } from "../types";

export type Role = {
  id: string;
  name: string;
  status: "0" | "1";
  createTime?: string;
  updateTime?: string;
  permissions?: string[];
};

export type RoleQuery = {
  page: number;
  size: number;
  id?: string;
  name?: string;
  status?: string;
  orderField?: string;
  orderValue?: "asc" | "desc";
};

export type RolePayload = {
  id?: string;
  name: string;
  status?: "0" | "1";
  permissions?: string[];
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
