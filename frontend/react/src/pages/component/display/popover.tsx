// src/pages/component/display/popover.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, CalendarDays, HelpCircle, Info, Settings, User } from "lucide-react";

export default function PopoverDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Popover 基础弹出框</h2>
      <div className="flex gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Dimensions</h4>
                <p className="text-sm text-muted-foreground">
                  Set the dimensions for the layer.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    defaultValue="100%"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxWidth">Max. width</Label>
                  <Input
                    id="maxWidth"
                    defaultValue="300px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    defaultValue="25px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxHeight">Max. height</Label>
                  <Input
                    id="maxHeight"
                    defaultValue="none"
                    className="col-span-2 h-8"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-xl font-bold">Direction Popover 弹出方向</h2>
      <div className="flex gap-4 flex-wrap items-center justify-center p-6 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" side="top" className="w-48">
              <p>Popover on top</p>
            </PopoverContent>
          </Popover>
          <span className="text-xs">Top</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" side="right" className="w-48">
              <p>Popover on right</p>
            </PopoverContent>
          </Popover>
          <span className="text-xs">Right</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" side="bottom" className="w-48">
              <p>Popover on bottom</p>
            </PopoverContent>
          </Popover>
          <span className="text-xs">Bottom</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" side="left" className="w-48">
              <p>Popover on left</p>
            </PopoverContent>
          </Popover>
          <span className="text-xs">Left</span>
        </div>
      </div>

      <h2 className="text-xl font-bold">With Icon 带图标的弹出框</h2>
      <div className="flex gap-4 flex-wrap items-center">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <p>
              This is an information popover. It provides additional context about a feature.
            </p>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <p>
              Need help? This popover contains useful tips and guidance.
            </p>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-2">
              <h4 className="font-medium leading-none">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Manage your notification preferences
              </p>
              <div className="flex items-center justify-between">
                <span>Email notifications</span>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="mr-2">On</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Push notifications</span>
                <div className="flex items-center">
                  <Button variant="outline" size="sm">Off</Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-xl font-bold">Form Inside Popover 弹出框内表单</h2>
      <div className="flex gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Edit Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Update your profile information
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="John Doe" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="john@example.com" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" defaultValue="Software Engineer" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-xl font-bold">Settings Popover 设置弹出框</h2>
      <div className="flex gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">App Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Customize your application preferences
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <Button variant="outline" size="sm">On</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-save</span>
                  <Button variant="outline" size="sm">On</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Keyboard shortcuts</span>
                  <Button variant="outline" size="sm">Off</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Analytics</span>
                  <Button variant="outline" size="sm">On</Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-xl font-bold">Action Popover 操作弹出框</h2>
      <div className="flex gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Schedule Post
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Schedule Post</h4>
                <p className="text-sm text-muted-foreground">
                  Choose when to publish your post
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input type="date" id="date" className="h-8" />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <p className="text-sm text-muted-foreground">Select a time</p>
                    <Input type="time" id="time" className="h-8" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Schedule</Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <h2 className="text-xl font-bold">Long Content Popover 长内容弹出框</h2>
      <div className="flex gap-4 flex-wrap">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">Terms of Service</Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-64 overflow-y-auto">
            <h4 className="font-medium leading-none mb-2">Terms of Service</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Last updated: January 1, 2024
            </p>
            <div className="text-xs space-y-2">
              <p>
                These Terms of Service govern your use of our services. By using our platform, 
                you agree to these terms and conditions.
              </p>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting to the website.
              </p>
              <p>
                Users must be at least 18 years old to use our services. By using our platform, 
                you represent that you are at least 18 years old.
              </p>
              <p>
                We are committed to protecting your privacy. Please review our Privacy Policy 
                for information about how we collect, use, and share your information.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}