"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Globe, Lock, ShieldAlert, ShieldCheck, Terminal, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { time: '00:00', attacks: 120, traffic: 45 },
  { time: '04:00', attacks: 80, traffic: 32 },
  { time: '08:00', attacks: 450, traffic: 89 },
  { time: '12:00', attacks: 300, traffic: 78 },
  { time: '16:00', attacks: 900, traffic: 95 },
  { time: '20:00', attacks: 600, traffic: 80 },
];

export default function SecurityDashboard() {
  return (
    // 使用 bg-background 和 text-foreground 确保主题跟随系统
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">安全运营中心 (SOC)</h1>
          <p className="text-muted-foreground italic">实时检测全球威胁威胁向量</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400">
            <ShieldCheck className="w-3 h-3 mr-1" /> 防火墙已保护
          </Badge>
          <Badge variant="destructive" className="animate-pulse">
            <Activity className="w-3 h-3 mr-1" /> 实时攻击中
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "拦截攻击", value: "24.5k", color: "text-destructive", icon: ShieldAlert },
          { label: "活跃漏洞", value: "3", color: "text-orange-500", icon: Zap },
          { label: "流量清洗", value: "1.2 TB", color: "text-primary", icon: Globe },
          { label: "安全合规", value: "94%", color: "text-green-500", icon: Lock },
        ].map((item, idx) => (
          <Card key={idx} className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>攻击频率趋势</CardTitle>
            <CardDescription>按时间跨度统计的恶意流量注入情况</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                    {/* 渐变色适配：明亮模式用浅蓝，暗黑模式用深蓝 */}
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                <YAxis className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="attacks" stroke="hsl(var(--primary))" fill="url(#chartColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <CardTitle>实时拦截日志</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { ip: "104.21.18.202", action: "SQLi 过滤", time: "14:22:10", status: "Blocked" },
                { ip: "185.12.9.14", action: "异地登录", time: "14:21:05", status: "Flagged" },
                { ip: "2.56.121.8", action: "DDos 节点", time: "14:20:59", status: "Blocked" },
                { ip: "192.168.1.5", action: "暴力破解", time: "14:18:44", status: "Dropped" },
              ].map((log, i) => (
                <div key={i} className="flex justify-between items-start border-l-2 border-primary pl-4">
                  <div>
                    <p className="text-sm font-mono font-bold">{log.ip}</p>
                    <p className="text-xs text-muted-foreground">{log.action}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{log.time}</span>
                    <p className="text-xs font-semibold text-primary">{log.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader>
          <CardTitle>高风险资产列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>资产 ID</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>最后扫描</TableHead>
                <TableHead className="text-right">漏洞数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Cluster-Node-01</TableCell>
                <TableCell><Badge variant="destructive">Critical</Badge></TableCell>
                <TableCell className="text-muted-foreground">2 分钟前</TableCell>
                <TableCell className="text-right font-bold text-destructive">14</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Auth-Gateway</TableCell>
                <TableCell><Badge variant="outline" className="text-orange-500 border-orange-200">Medium</Badge></TableCell>
                <TableCell className="text-muted-foreground">1 小时前</TableCell>
                <TableCell className="text-right">2</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}