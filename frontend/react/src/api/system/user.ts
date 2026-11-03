import axios from "@/lib/axios";
import type { Status } from "@/lib/status";
import type { PageResult } from "../types";
import type { components } from "../schema";

type UserContract = components["schemas"]["UserBean"];

export type User = Omit<
  UserContract,
  | "id"
  | "name"
  | "username"
  | "email"
  | "groupId"
  | "groupName"
  | "status"
  | "createTime"
  | "updateTime"
  | "phone"
> & {
  id: string;
  name: string;
  username: string;
  email: string;
  groupId: string;
  groupName: string;
  status: Status;
  createTime: string;
  updateTime: string;
  phone: string;
};

export type UserQuery = components["schemas"]["QueryUserReq"] & {
  page: number;
  size: number;
  direction?: "asc" | "desc";
};

export type UserPayload = Partial<
  components["schemas"]["AddUserReq"] & components["schemas"]["EditUserReq"]
> & {
  status?: Status;
};

export async function listUsers(params: UserQuery, signal?: AbortSignal) {
  const res = await axios.get<{ data: PageResult<User> }>("/system/users", {
    params,
    signal,
  });
  return res.data.data;
}

export async function getUser(id: string) {
  const res = await axios.get<{ data: User }>(`/system/users/${id}`);
  return res.data.data;
}

export async function createUser(payload: UserPayload) {
  const res = await axios.post<{ data: string }>("/system/users", payload);
  return res.data.data;
}

export async function updateUser(id: string, payload: UserPayload) {
  await axios.patch(`/system/users/${id}`, { ...payload, id });
}

export async function updateUserStatus(id: string, status: Status) {
  await axios.patch(`/system/users/${id}/status`, { status });
}

export async function resetUserPassword(id: string) {
  const res = await axios.post<{ data: string }>(
    `/system/users/${id}/reset-password`,
  );
  return res.data.data;
}

export async function changeOwnPassword(oldPassword: string, newPassword: string) {
  const res = await axios.post<{ message: string }>("/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return res.data.message;
}

export async function deleteUsers(ids: string[]) {
  if (ids.length === 0) return;
  await axios.delete("/system/users", { params: { ids: ids.join(",") } });
}
