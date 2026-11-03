import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  FilePlus2,
  LogOut,
  Settings,
  Trash2,
  User,
} from "lucide-react";
export default function DropdownPage() {
  const handleSelect = (label: string) => {
    alert(`你选择了 / You selected: ${label}`);
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-semibold">🔽 Shadcn 下拉菜单综合演示 / Shadcn DropdownMenu Showcase</h2>

      {/* 1️⃣ 基础按钮触发 / Basic Button Trigger */}
      <div>
        <h3 className="font-medium mb-2">1️⃣ 按钮触发 / Button Trigger</h3>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline">
              操作 / Actions <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem onSelect={() => handleSelect("新建 / New")}>
              <FilePlus2 className="w-4 h-4 mr-2" /> 新建 / New
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleSelect("编辑 / Edit")}>
              <Edit className="w-4 h-4 mr-2" /> 编辑 / Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleSelect("删除 / Delete")}>
              <Trash2 className="w-4 h-4 mr-2 text-red-500" /> 删除 / Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2️⃣ 分组 & 禁用 / Group & Disabled */}
      <div>
        <h3 className="font-medium mb-2">2️⃣ 分组与禁用 / Group & Disabled</h3>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline">用户管理 / User Menu</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuLabel>账户操作 / Account Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => handleSelect("个人信息 / Profile")}>
                <User className="w-4 h-4 mr-2" /> 个人信息 / Profile
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="w-4 h-4 mr-2 opacity-50" /> 设置（禁用）/ Settings (Disabled)
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleSelect("退出登录 / Logout")}>
              <LogOut className="w-4 h-4 mr-2 text-red-500" /> 退出登录 / Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3️⃣ 子菜单 / Submenu */}
      <div>
        <h3 className="font-medium mb-2">3️⃣ 子菜单 / Submenu</h3>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline">更多选项 / More Options</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem>简单项 / Simple Item</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                高级设置 / Advanced <ChevronRight className="ml-auto w-4 h-4" />
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent sideOffset={4}>
                  <DropdownMenuItem onSelect={() => handleSelect("安全设置 / Security")}>
                    安全设置 / Security
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleSelect("隐私设置 / Privacy")}>
                    隐私设置 / Privacy
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 4️⃣ 箭头指向 / With Arrow */}
      <div>
        <h3 className="font-medium mb-2">4️⃣ 带箭头指向 / With Arrow</h3>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline">箭头菜单 / Menu with Arrow</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="center" sideOffset={6} side="bottom">
            <DropdownMenuItem>菜单项 A / Menu A</DropdownMenuItem>
            <DropdownMenuItem>菜单项 B / Menu B</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
