import { http, HttpResponse } from "msw";

type OperationLog = {
  id: number;
  traceId: string;
  username: string;
  method: string;
  path: string;
  queryString?: string;
  requestBody?: string;
  status: number;
  durationMs: number;
  ip: string;
  createTime: string;
};

const logs: OperationLog[] = [
  {
    id: 3,
    traceId: "5f2c7d9a1b3e4f60",
    username: "super",
    method: "PATCH",
    path: "/api/v1/system/users/1001",
    requestBody: "{\"name\":\"张三\",\"email\":\"zhangsan@example.com\"}",
    status: 200,
    durationMs: 42,
    ip: "127.0.0.1",
    createTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    traceId: "8a1b2c3d4e5f6071",
    username: "admin",
    method: "POST",
    path: "/api/v1/system/permissions/children",
    requestBody: "{\"id\":\"000504\",\"name\":\"操作日志\"}",
    status: 201,
    durationMs: 65,
    ip: "127.0.0.1",
    createTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 1,
    traceId: "9c8b7a6d5e4f3021",
    username: "admin",
    method: "DELETE",
    path: "/api/v1/system/groups",
    queryString: "ids=0009",
    status: 409,
    durationMs: 18,
    ip: "127.0.0.1",
    createTime: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
];

const handlers = [
  http.get("/api/v1/system/operation-logs", ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = Math.max(1, Number(url.searchParams.get("size") || 10));
    const username = (url.searchParams.get("username") || "").toLowerCase();
    const path = (url.searchParams.get("path") || "").toLowerCase();
    const status = url.searchParams.get("status") || "";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const filtered = logs.filter((log) => {
      if (username && !log.username.toLowerCase().includes(username)) return false;
      if (path && !log.path.toLowerCase().includes(path)) return false;
      if (status && log.status !== Number(status)) return false;
      const time = new Date(log.createTime).getTime();
      if (from && time < new Date(from).getTime()) return false;
      if (to && time > new Date(to).getTime()) return false;
      return true;
    });

    const offset = (page - 1) * size;
    return HttpResponse.json({
      code: 200,
      data: {
        total: filtered.length,
        list: filtered.slice(offset, offset + size),
        page,
        size,
        totalPages: Math.ceil(filtered.length / size),
      },
    });
  }),
];

export default handlers;
