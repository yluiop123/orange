import {
  listOperationLogs,
  type OperationLog,
  type OperationLogQuery,
} from "@/api/system/operation-log";
import { ResourceTable, useResourceList } from "@/components/system/resource-list";
import type { ListParams } from "@/components/system/resource-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/date-time";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";

type TableParams = ListParams<OperationLogQuery>;

const STATUS_OPTIONS = ["", "200", "201", "400", "401", "403", "404", "409", "500"];

function toIso(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function OperationLogPage() {
  const intl = useIntl();
  const [params, setParams] = useState<TableParams>({
    page: 1,
    size: 10,
    username: "",
    path: "",
    status: "",
    from: "",
    to: "",
  });
  const [detail, setDetail] = useState<OperationLog | null>(null);

  const { data, loading, error, refetch } = useResourceList<TableParams, OperationLog>({
    params,
    errorMessage: intl.formatMessage({ id: "table.loadError" }),
    fetcher: (query, signal) =>
      listOperationLogs(
        {
          page: query.page,
          size: query.size,
          username: query.username || undefined,
          path: query.path || undefined,
          status: query.status || undefined,
          from: toIso(query.from ?? ""),
          to: toIso(query.to ?? ""),
        },
        signal,
      ),
  });

  const columns: ColumnDef<OperationLog>[] = [
    {
      accessorKey: "createTime",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.createTime" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.createTime" }),
      cell: ({ row }) => <div className="whitespace-nowrap">{formatDateTime(row.getValue("createTime"))}</div>,
    },
    {
      accessorKey: "username",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.username" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.username" }),
      cell: ({ row }) => <div>{row.getValue("username")}</div>,
    },
    {
      accessorKey: "method",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.method" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.method" }),
      cell: ({ row }) => <div className="font-mono">{row.getValue("method")}</div>,
    },
    {
      accessorKey: "path",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.path" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.path" }),
      cell: ({ row }) => <div className="font-mono">{row.getValue("path")}</div>,
    },
    {
      accessorKey: "status",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.status" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.status" }),
      cell: ({ row }) => {
        const status = row.getValue<number>("status");
        return (
          <span className={status >= 400 ? "text-destructive" : undefined}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "durationMs",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.duration" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.duration" }),
      cell: ({ row }) => <div>{row.getValue("durationMs")} ms</div>,
    },
    {
      accessorKey: "ip",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.ip" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.ip" }),
      cell: ({ row }) => <div>{row.getValue("ip")}</div>,
    },
    {
      accessorKey: "traceId",
      meta: { title: intl.formatMessage({ id: "page.system.operationLog.header.traceId" }) },
      header: intl.formatMessage({ id: "page.system.operationLog.header.traceId" }),
      cell: ({ row }) => (
        <div className="max-w-40 truncate font-mono" title={row.getValue("traceId")}>
          {row.getValue("traceId")}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">{intl.formatMessage({ id: "table.openMenu" })}</span>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{intl.formatMessage({ id: "table.actions" })}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDetail(row.original)}>
                {intl.formatMessage({ id: "button.detail" })}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="w-full p-3">
      <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: "button.detail" })}</DialogTitle>
            <DialogDescription className="font-mono">
              {detail?.method} {detail?.path}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid gap-3 text-sm">
            <div className="grid gap-1">
              <dt className="text-muted-foreground">
                {intl.formatMessage({ id: "page.system.operationLog.header.traceId" })}
              </dt>
              <dd className="break-all font-mono">{detail?.traceId ?? "-"}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">
                {intl.formatMessage({ id: "page.system.operationLog.queryString" })}
              </dt>
              <dd className="break-all font-mono">{detail?.queryString ?? "-"}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">
                {intl.formatMessage({ id: "page.system.operationLog.requestBody" })}
              </dt>
              <dd className="max-h-64 overflow-auto rounded-md bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
                {detail?.requestBody ?? "-"}
              </dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3 py-3">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap" htmlFor="operationLogUsername">
            {intl.formatMessage({ id: "page.system.operationLog.header.username" })}
          </Label>
          <Input
            id="operationLogUsername"
            value={params.username}
            onChange={(event) =>
              setParams((prev) => ({ ...prev, username: event.target.value, page: 1 }))
            }
            className="w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap" htmlFor="operationLogPath">
            {intl.formatMessage({ id: "page.system.operationLog.header.path" })}
          </Label>
          <Input
            id="operationLogPath"
            value={params.path}
            onChange={(event) =>
              setParams((prev) => ({ ...prev, path: event.target.value, page: 1 }))
            }
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">
            {intl.formatMessage({ id: "page.system.operationLog.header.status" })}
          </Label>
          <Select
            value={params.status || "all"}
            onValueChange={(value) =>
              setParams((prev) => ({
                ...prev,
                status: !value || value === "all" ? "" : value,
                page: 1,
              }))
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue>
                {params.status || intl.formatMessage({ id: "dict.status.all" })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status || "all"} value={status || "all"}>
                  {status || intl.formatMessage({ id: "dict.status.all" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap" htmlFor="operationLogFrom">
            {intl.formatMessage({ id: "page.system.operationLog.header.from" })}
          </Label>
          <Input
            id="operationLogFrom"
            type="datetime-local"
            value={params.from}
            onChange={(event) =>
              setParams((prev) => ({ ...prev, from: event.target.value, page: 1 }))
            }
            className="w-52"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap" htmlFor="operationLogTo">
            {intl.formatMessage({ id: "page.system.operationLog.header.to" })}
          </Label>
          <Input
            id="operationLogTo"
            type="datetime-local"
            value={params.to}
            onChange={(event) =>
              setParams((prev) => ({ ...prev, to: event.target.value, page: 1 }))
            }
            className="w-52"
          />
        </div>
        <Button variant="outline" onClick={refetch}>
          {intl.formatMessage({ id: "button.refresh" })}
        </Button>
      </div>

      <ResourceTable
        data={data.list}
        columns={columns}
        total={data.total}
        page={params.page}
        size={params.size}
        onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
        getRowId={(row) => String(row.id)}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
