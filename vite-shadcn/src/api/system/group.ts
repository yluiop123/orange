import axios from "@/lib/axios";

export type Group = {
  id: string;
  name: string;
  order?: number;
  status?: "0" | "1";
  parentId?: string | null;
  createTime?: string;
  updateTime?: string;
};

export type GroupQuery = {
  id?: string;
  name?: string;
  status?: string;
};

export type GroupPayload = {
  id?: string;
  name?: string;
  status?: "0" | "1";
  parentId?: string;
};

export type MoveAction = "up" | "down" | "top";

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

export async function updateGroupStatus(id: string, status: "0" | "1") {
  await axios.patch(`/system/groups/${id}/status`, { status });
}

export async function addGroupChild(payload: { id: string; name: string; parentId?: string }) {
  await axios.post("/system/groups/children", payload);
}

export async function addGroupSibling(payload: { id: string; name: string; brotherId: string }) {
  await axios.post("/system/groups/siblings", payload);
}

export async function moveGroup(id: string, action: MoveAction) {
  await axios.post(`/system/groups/${id}/move`, { action });
}

export async function deleteGroups(ids: string[]) {
  if (ids.length === 0) return;
  await axios.delete("/system/groups", { params: { ids: ids.join(",") } });
}
