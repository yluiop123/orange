import axios from "@/lib/axios";
import type { Status } from "@/lib/status";
import type { components } from "../schema";

export type Group = components["schemas"]["GroupBean"] & {
  id: string;
  name: string;
  status?: Status;
  parentId?: string | null;
};

export type GroupQuery = components["schemas"]["QueryGroupReq"];

export type GroupPayload = Partial<
  components["schemas"]["AddChildGroupReq"] & components["schemas"]["EditGroupReq"]
> & {
  status?: Status;
};

export async function listGroups(params?: GroupQuery, signal?: AbortSignal) {
  const res = await axios.get<{ data: Group[] }>("/system/groups", {
    params,
    signal,
  });
  return res.data.data;
}

export async function getGroup(id: string) {
  const res = await axios.get<{ data: Group }>(`/system/groups/${id}`);
  return res.data.data;
}

export async function updateGroup(id: string, payload: GroupPayload) {
  await axios.patch(`/system/groups/${id}`, { ...payload, id });
}

export async function updateGroupStatus(id: string, status: Status) {
  await axios.patch(`/system/groups/${id}/status`, { status });
}

export async function addGroupChild(payload: { id: string; name: string; parentId?: string }) {
  await axios.post("/system/groups/children", payload);
}

export async function deleteGroups(ids: string[]) {
  if (ids.length === 0) return;
  await axios.delete("/system/groups", { params: { ids: ids.join(",") } });
}
