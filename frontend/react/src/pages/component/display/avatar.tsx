import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import orangeLogo from "@/assets/orange.png";

export default function AvatarDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Usage 基本用法</h2>
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={orangeLogo} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={orangeLogo} />
          <AvatarFallback>RU</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="invalid-url" />
          <AvatarFallback>UF</AvatarFallback>
        </Avatar>
      </div>

      <h2 className="text-xl font-bold">Sizes 大小</h2>
      <div className="flex items-center gap-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={orangeLogo} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="h-12 w-12">
          <AvatarImage src={orangeLogo} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="h-16 w-16">
          <AvatarImage src={orangeLogo} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="h-24 w-24">
          <AvatarImage src={orangeLogo} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>

      <h2 className="text-xl font-bold">With Badge 带徽章</h2>
      <div className="flex gap-4">
        <div className="relative">
          <Avatar>
            <AvatarImage src={orangeLogo} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500">
            <span className="sr-only">Online</span>
          </Badge>
        </div>
        <div className="relative">
          <Avatar>
            <AvatarImage src="https://github.com/radix-ui.png" />
            <AvatarFallback>RU</AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-red-500">
            <span className="sr-only">Offline</span>
          </Badge>
        </div>
      </div>

      <h2 className="text-xl font-bold">Fallback Types 回退类型</h2>
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src="invalid-url" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="invalid-url" />
          <AvatarFallback>John Doe</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="invalid-url" />
          <AvatarFallback className="text-xl">👤</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}