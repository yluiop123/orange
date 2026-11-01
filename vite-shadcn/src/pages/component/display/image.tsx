// src/pages/component/display/image.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import orangeLogo from "@/assets/orange.png";

export default function ImageDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Avatar Image 头像图片</h2>
      <div className="flex flex-wrap gap-6">
        <Card className="w-64">
          <CardHeader className="items-center">
            <Avatar className="size-24">
              <AvatarImage src={orangeLogo} alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <CardTitle>With Image</CardTitle>
            <CardDescription>Avatar with image</CardDescription>
          </CardHeader>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <Avatar className="size-24">
              <AvatarImage src="/non-existent-image.png" alt="@nonexistent" />
              <AvatarFallback>NC</AvatarFallback>
            </Avatar>
            <CardTitle>Fallback</CardTitle>
            <CardDescription>Avatar with fallback</CardDescription>
          </CardHeader>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <Avatar className="size-24">
              <AvatarFallback className="bg-blue-100 text-blue-800">JD</AvatarFallback>
            </Avatar>
            <CardTitle>Initials</CardTitle>
            <CardDescription>Avatar with initials</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Different Sizes 不同尺寸</h2>
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Avatar className="size-10">
          <AvatarImage src={orangeLogo} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="size-16">
          <AvatarImage src={orangeLogo} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="size-24">
          <AvatarImage src={orangeLogo} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="size-32">
          <AvatarImage src={orangeLogo} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>

      <h2 className="text-xl font-bold">Avatar Groups 头像组合</h2>
      <div className="flex items-center -space-x-4 p-4 bg-gray-50 rounded-lg">
        <Avatar className="size-12 border-2 border-white">
          <AvatarImage src={orangeLogo} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="size-12 border-2 border-white">
          <AvatarImage src="https://randomuser.me/api/portraits/men/1.jpg" alt="@user1" />
          <AvatarFallback>U1</AvatarFallback>
        </Avatar>
        <Avatar className="size-12 border-2 border-white">
          <AvatarImage src="https://randomuser.me/api/portraits/women/1.jpg" alt="@user2" />
          <AvatarFallback>U2</AvatarFallback>
        </Avatar>
        <Avatar className="size-12 border-2 border-white bg-gray-200">
          <AvatarFallback className="text-gray-600">+3</AvatarFallback>
        </Avatar>
      </div>

      <h2 className="text-xl font-bold">Square Avatars 方形头像</h2>
      <div className="flex flex-wrap gap-6">
        <Card className="w-64">
          <CardHeader className="items-center">
            <Avatar className="size-24 rounded-md">
              <AvatarImage src={orangeLogo} alt="@shadcn" />
              <AvatarFallback className="rounded-md">CN</AvatarFallback>
            </Avatar>
            <CardTitle>Rounded Medium</CardTitle>
            <CardDescription>Square avatar with medium rounding</CardDescription>
          </CardHeader>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <Avatar className="size-24 rounded-sm">
              <AvatarImage src="https://randomuser.me/api/portraits/men/2.jpg" alt="@user" />
              <AvatarFallback className="rounded-sm">US</AvatarFallback>
            </Avatar>
            <CardTitle>Rounded Small</CardTitle>
            <CardDescription>Square avatar with small rounding</CardDescription>
          </CardHeader>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <Avatar className="size-24 rounded-none">
              <AvatarImage src="https://randomuser.me/api/portraits/women/2.jpg" alt="@user" />
              <AvatarFallback className="rounded-none">US</AvatarFallback>
            </Avatar>
            <CardTitle>Square</CardTitle>
            <CardDescription>Completely square avatar</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Avatar with Status 带状态的头像</h2>
      <div className="flex flex-wrap gap-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src="https://randomuser.me/api/portraits/men/3.jpg" alt="@online" />
              <AvatarFallback>ON</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <span className="mt-2 text-sm">Online</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src="https://randomuser.me/api/portraits/women/3.jpg" alt="@away" />
              <AvatarFallback>AW</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
          </div>
          <span className="mt-2 text-sm">Away</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src="https://randomuser.me/api/portraits/men/4.jpg" alt="@busy" />
              <AvatarFallback>BS</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <span className="mt-2 text-sm">Busy</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src="https://randomuser.me/api/portraits/women/4.jpg" alt="@offline" />
              <AvatarFallback>OF</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
          </div>
          <span className="mt-2 text-sm">Offline</span>
        </div>
      </div>
    </div>
  );
}