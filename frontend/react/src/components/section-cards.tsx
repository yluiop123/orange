import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

// 这里的 CardAction 如果在你的组件库中没有定义，可以用普通的 div 代替
// 为了确保兼容性，我将其整合进 Header 的 flex 布局中

export function SectionCards() {
  const cardData = [
    {
      title: "Total Revenue",
      value: "$1,250.00",
      trend: "+12.5%",
      isUp: true,
      footer: "Trending up this month",
      subFooter: "Visitors for the last 6 months",
    },
    {
      title: "New Customers",
      value: "1,234",
      trend: "-20%",
      isUp: false,
      footer: "Down 20% this period",
      subFooter: "Acquisition needs attention",
    },
    {
      title: "Active Accounts",
      value: "45,678",
      trend: "+12.5%",
      isUp: true,
      footer: "Strong user retention",
      subFooter: "Engagement exceed targets",
    },
    {
      title: "Growth Rate",
      value: "4.5%",
      trend: "+4.5%",
      isUp: true,
      footer: "Steady performance increase",
      subFooter: "Meets growth projections",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 xl:grid-cols-4 lg:p-6">
      {cardData.map((item, index) => (
        <Card 
          key={index} 
          className={cn(
            "relative overflow-hidden border-none shadow-sm transition-all hover:shadow-md",
            "bg-gradient-to-br from-background to-muted/30 dark:to-muted/10",
            "before:absolute before:inset-0 before:bg-primary/5 before:opacity-0 hover:before:opacity-100 transition-opacity"
          )}
        >
          <CardHeader className="space-y-2.5 pb-4">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardDescription>
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1 border-none px-2 py-0.5 font-bold",
                  item.isUp 
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                )}
              >
                {item.isUp ? <IconTrendingUp size={14} /> : <IconTrendingDown size={14} />}
                {item.trend}
              </Badge>
            </div>
            
            <CardTitle className="text-3xl font-bold tracking-tight tabular-nums">
              {item.value}
            </CardTitle>
          </CardHeader>

          <CardFooter className="flex flex-col items-start gap-1 border-t border-primary/5 pt-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              {item.footer}
              {item.isUp ? (
                <IconTrendingUp className="size-4 text-green-600" />
              ) : (
                <IconTrendingDown className="size-4 text-red-600" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.subFooter}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}