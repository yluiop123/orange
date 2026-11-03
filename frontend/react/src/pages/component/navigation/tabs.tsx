import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Bell,
    FileText,
    Lock,
    Settings,
    User,
} from "lucide-react";
import { useState } from "react";

export default function TabsDemoPage() {
  const [controlledTab, setControlledTab] = useState("tab1");

  return (
    <div className="p-8 space-y-14">
      <h1 className="text-2xl font-bold">
        Tabs 组件示例 <span className="text-muted-foreground">(Tabs Demo)</span>
      </h1>

      {/* 1️⃣ 基础 Tabs */}
      <Section
        title="基础用法"
        subtitle="Basic Usage"
      >
        <Tabs defaultValue="a" className="w-105">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="a">
              标签 A (Tab A)
            </TabsTrigger>
            <TabsTrigger value="b">
              标签 B (Tab B)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="a">
            内容 A (Content A)
          </TabsContent>
          <TabsContent value="b">
            内容 B (Content B)
          </TabsContent>
        </Tabs>
      </Section>

      {/* 2️⃣ 业务 Tabs */}
      <Section
        title="业务场景示例"
        subtitle="Business Scenario"
      >
        <Tabs defaultValue="profile" className="max-w-xl">
          <TabsList>
            <TabsTrigger value="profile">
              个人信息 (Profile)
            </TabsTrigger>
            <TabsTrigger value="security">
              安全设置 (Security)
            </TabsTrigger>
            <TabsTrigger value="notify">
              通知设置 (Notification)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3">
            <Input placeholder="用户名 (Username)" />
            <Input placeholder="邮箱 (Email)" />
            <Button>保存 (Save)</Button>
          </TabsContent>

          <TabsContent value="security" className="space-y-3">
            <Input
              type="password"
              placeholder="新密码 (New Password)"
            />
            <Button variant="destructive">
              修改密码 (Change Password)
            </Button>
          </TabsContent>

          <TabsContent value="notify">
            <p className="text-muted-foreground">
              通知偏好设置内容 (Notification preferences)
            </p>
          </TabsContent>
        </Tabs>
      </Section>

      {/* 3️⃣ 受控 Tabs */}
      <Section
        title="受控模式"
        subtitle="Controlled Tabs"
      >
        <Tabs value={controlledTab} onValueChange={setControlledTab}>
          <TabsList>
            <TabsTrigger value="tab1">
              标签 1 (Tab 1)
            </TabsTrigger>
            <TabsTrigger value="tab2">
              标签 2 (Tab 2)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tab1">
            当前标签：
            <b className="ml-1">
              {controlledTab}
            </b>
          </TabsContent>

          <TabsContent value="tab2">
            当前标签：
            <b className="ml-1">
              {controlledTab}
            </b>
          </TabsContent>
        </Tabs>
      </Section>

      {/* 4️⃣ Icon Tabs */}
      <Section
        title="带图标的 Tabs"
        subtitle="Tabs with Icons"
      >
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account" className="flex gap-2">
              <User className="w-4 h-4" />
              账号 (Account)
            </TabsTrigger>
            <TabsTrigger value="security" className="flex gap-2">
              <Lock className="w-4 h-4" />
              安全 (Security)
            </TabsTrigger>
            <TabsTrigger value="notify" className="flex gap-2">
              <Bell className="w-4 h-4" />
              通知 (Notify)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            账号相关内容 (Account content)
          </TabsContent>
          <TabsContent value="security">
            安全相关内容 (Security content)
          </TabsContent>
          <TabsContent value="notify">
            通知相关内容 (Notification content)
          </TabsContent>
        </Tabs>
      </Section>

      {/* 5️⃣ Tabs + Card */}
      <Section
        title="卡片组合用法"
        subtitle="Tabs with Card"
      >
        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs">
              <FileText className="w-4 h-4 mr-1 inline" />
              日志 (Logs)
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-1 inline" />
              设置 (Settings)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>
                  系统日志 (System Logs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                日志内容展示区域
                <br />
                (Log content area)
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6">
                系统设置内容区域
                <br />
                (System settings area)
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  );
}

/* ========================= */
/* 通用 Section 组件（双语） */
/* ========================= */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        {title}
        <span className="ml-2 text-muted-foreground font-normal">
          ({subtitle})
        </span>
      </h2>
      {children}
    </section>
  );
}
