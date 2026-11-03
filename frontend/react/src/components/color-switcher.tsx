import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useThemeStore } from "@/store/index"
import { BadgeCheckIcon } from "lucide-react"
const colors = ["default", "blue", "green", "orange", "red", "rose", "violet", "yellow"] as const
const colorsMap = {
    default: "bg-gray-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    yellow: "bg-yellow-500",
}
export function ColorSwitcher() {
    const { color, setColor } = useThemeStore()
    return (
        <Popover>
            <PopoverTrigger>
                <Badge className={cn('w-6 h-6 text-sm px-2 py-1 flex items-center justify-center')}                        >
                    <BadgeCheckIcon className="w-8 h-8 text-white" />
                </Badge >


            </PopoverTrigger>
            <PopoverContent className="w-fit p-2">
                <div className="grid grid-cols-4 gap-2">
                    {colors.map((c) => (
                        <Badge
                            key={c}
                            variant="outline"
                            className={cn(colorsMap[c], 'w-8 h-8 text-sm px-2 py-1 flex items-center justify-center')}
                            onClick={() => setColor(c)}>
                            {color === c && <BadgeCheckIcon className="w-8 h-8 text-white" />}
                        </Badge >
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
