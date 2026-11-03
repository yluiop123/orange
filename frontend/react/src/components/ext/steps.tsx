import clsx from "clsx";
import * as React from "react";

type StepStatus = "wait" | "process" | "finish" | "error";

interface StepItem {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: StepStatus;
}

interface StepsProps {
  items: StepItem[];
  current?: number;
  direction?: "horizontal" | "vertical";
  size?: "default" | "small";
  onChange?: (current: number) => void;
}

const statusColorMap: Record<StepStatus, string> = {
  wait: "border-muted text-muted-foreground",
  process: "border-primary text-primary",
  finish: "border-green-500 text-green-500",
  error: "border-destructive text-destructive",
};

export function Steps({
  items,
  current = 0,
  direction = "horizontal",
  size = "default",
  onChange,
}: StepsProps) {
  return (
    <div
      className={clsx(
        "flex",
        direction === "vertical" ? "flex-col" : "items-center"
      )}
    >
      {items.map((item, index) => {
        const status: StepStatus =
          item.status ??
          (index < current
            ? "finish"
            : index === current
            ? "process"
            : "wait");

        const isSmall = size === "small";

        return (
          <React.Fragment key={index}>
            <div
              className={clsx(
                "flex cursor-pointer",
                direction === "vertical" ? "items-start" : "items-center"
              )}
              onClick={() => onChange?.(index)}
            >
              {/* 圆点 / 图标 */}
              <div
                className={clsx(
                  "flex items-center justify-center rounded-full border transition-colors",
                  statusColorMap[status],
                  isSmall ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
                )}
              >
                {item.icon ?? index + 1}
              </div>

              {/* 文本 */}
              <div className={clsx("ml-3", isSmall && "ml-2")}>
                <div
                  className={clsx(
                    "font-medium leading-tight",
                    status === "wait" && "text-muted-foreground"
                  )}
                >
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </div>
                )}
              </div>
            </div>

            {/* 连接线 */}
            {index < items.length - 1 && (
              <div
                className={clsx(
                  "transition-all duration-300",
                  direction === "horizontal"
                    ? clsx(
                        "mx-3 h-px flex-1",
                        index < current ? "bg-primary" : "bg-border"
                      )
                    : clsx(
                        "ml-4 my-2 w-px h-6",
                        index < current ? "bg-primary" : "bg-border"
                      )
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
