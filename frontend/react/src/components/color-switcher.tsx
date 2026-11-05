import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useThemeStore } from "@/store/index"
import { BadgeCheckIcon } from "lucide-react"

const colors = ["default", "blue", "green", "orange", "red", "rose", "violet", "yellow"] as const
const colorsMap: Record<(typeof colors)[number], string> = {
  default: "bg-foreground",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  yellow: "bg-yellow-500",
}

function checkClass(item: (typeof colors)[number]) {
  return cn("size-4", item === "default" ? "text-background" : "text-white")
}

export function ColorSwitcher() {
  const { color, setColor } = useThemeStore()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Theme color"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border border-border shadow-xs outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
              colorsMap[color],
            )}
          >
            <BadgeCheckIcon className={checkClass(color)} />
          </button>
        }
      />
      <PopoverContent align="end" className="w-fit p-2">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((item) => (
            <button
              key={item}
              type="button"
              aria-label={item}
              onClick={() => setColor(item)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full border border-border outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
                colorsMap[item],
              )}
            >
              {color === item && <BadgeCheckIcon className={checkClass(item)} />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
