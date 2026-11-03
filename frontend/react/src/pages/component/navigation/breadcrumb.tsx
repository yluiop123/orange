import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Home } from "lucide-react";
import React from "react";

type BreadcrumbItem = {
  key: string;
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  menu?: React.ReactNode;
  separator?: React.ReactNode;
};

function Breadcrumb({
  items,
  className = "",
  separator = <ChevronRight className="w-4 h-4 text-muted-foreground" />,
}: {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}) {
  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="breadcrumb">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        const sep = it.separator ?? separator;
        return (
          <div key={it.key} className="flex items-center">
            {it.icon ? <span className="mr-2 flex items-center">{it.icon}</span> : null}
            {it.menu ? (
              <div>{it.menu}</div>
            ) : it.href && !isLast ? (
              <a href={it.href} className="text-primary hover:underline">
                {it.label}
              </a>
            ) : (
              <span className={isLast ? "font-medium" : "text-muted-foreground"}>{it.label}</span>
            )}
            {!isLast ? <span className="mx-3">{sep}</span> : null}
          </div>
        );
      })}
    </nav>
  );
}

export default function BreadcrumbPage() {
  const baseItems: BreadcrumbItem[] = [
    { key: "home", label: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
    { key: "docs", label: "Docs", href: "/docs" },
    { key: "components", label: "Components", href: "/docs/components" },
    { key: "breadcrumb", label: "Breadcrumb" },
  ];

  const docsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" className="px-1 py-0">
          Docs <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <a href="/docs/getting-started">Getting started</a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/docs/components">Components</a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/docs/primitives">Primitives</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const menuItems: BreadcrumbItem[] = [
    { key: "home", label: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
    { key: "docs-menu", label: "Docs", menu: docsMenu },
    { key: "components", label: "Components", href: "/docs/components" },
    { key: "current", label: "Breadcrumb" },
  ];

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-semibold">面包屑 / Breadcrumb</h2>

      {/* 1. 最简单的用法 / Basic Usage */}
      <section className="space-y-2">
        <h3 className="font-medium">1️⃣ 最简单的用法 / Basic Usage</h3>
        <div className="p-4 rounded-lg border bg-card">
          <Breadcrumb items={baseItems} />
        </div>
      </section>

      {/* 2. 图标放在文字前面 / Icon before label */}
      <section className="space-y-2">
        <h3 className="font-medium">2️⃣ 图标放在文字前面 / Icon before label</h3>
        <div className="p-4 rounded-lg border bg-card">
          <Breadcrumb
            items={baseItems.map((it, i) => ({
              ...it,
              icon: i === 0 ? <Home className="w-4 h-4 text-muted-foreground" /> : undefined,
            }))}
          />
        </div>
      </section>

      {/* 3. 可以自定义分隔符 / Custom Separator */}
      <section className="space-y-2">
        <h3 className="font-medium">3️⃣ 自定义分隔符 / Custom Separator</h3>
        <div className="p-4 rounded-lg border bg-card">
          <Breadcrumb items={baseItems} separator={<span className="px-1">/</span>} />
        </div>
      </section>

      {/* 4. 带下拉菜单的面包屑 / Dropdown Menu Breadcrumb */}
      <section className="space-y-2">
        <h3 className="font-medium">4️⃣ 带下拉菜单的面包屑 / Dropdown Menu Breadcrumb</h3>
        <div className="p-4 rounded-lg border bg-card">
          <Breadcrumb items={menuItems} />
        </div>
      </section>

      {/* 5. 自定义单独的分隔符 / Per-item Custom Separator */}
      <section className="space-y-2">
        <h3 className="font-medium">5️⃣ 自定义单独的分隔符 / Per-item Custom Separator</h3>
        <div className="p-4 rounded-lg border bg-card">
          <Breadcrumb
            items={baseItems.map((it) => {
              if (it.key === "components") {
                return { ...it, separator: <span className="px-1">•</span> };
              }
              return it;
            })}
          />
        </div>
      </section>
    </div>
  );
}