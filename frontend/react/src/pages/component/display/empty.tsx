// src/pages/component/display/empty.tsx
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FolderOpen, Search, Settings, UserRoundPlus } from "lucide-react";

export default function EmptyDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Empty 基础空状态</h2>
      <div className="w-full max-w-md mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No documents</EmptyTitle>
            <EmptyDescription>Create your first document to get started</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <h2 className="text-xl font-bold">With Actions 带操作的空状态</h2>
      <div className="w-full max-w-md mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search to find what you're looking for
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Clear filters</Button>
          </EmptyContent>
        </Empty>
      </div>

      <h2 className="text-xl font-bold">User Registration 空用户列表</h2>
      <div className="w-full max-w-md mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundPlus className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No users</EmptyTitle>
            <EmptyDescription>
              Get started by creating a new user or importing existing ones
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button variant="outline">Import</Button>
              <Button>Create user</Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>

      <h2 className="text-xl font-bold">Settings Empty 设置空状态</h2>
      <div className="w-full max-w-md mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Settings className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No settings configured</EmptyTitle>
            <EmptyDescription>
              Configure your settings to customize the application behavior
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Configure settings</Button>
          </EmptyContent>
        </Empty>
      </div>

      <h2 className="text-xl font-bold">Large Empty Content 大内容空状态</h2>
      <div className="w-full max-w-lg mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen className="h-8 w-8" />
            </EmptyMedia>
            <EmptyTitle>All caught up!</EmptyTitle>
            <EmptyDescription>
              You've viewed all the items in this list. Check back later for new items.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-col gap-2">
              <Button variant="outline">Refresh</Button>
              <Button variant="ghost">Go to dashboard</Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>

      <h2 className="text-xl font-bold">Custom Media 自定义媒体内容</h2>
      <div className="w-full max-w-md mx-auto">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">404</span>
              </div>
            </EmptyMedia>
            <EmptyTitle>Page not found</EmptyTitle>
            <EmptyDescription>
              The page you're looking for doesn't exist or has been moved.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Go home</Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}