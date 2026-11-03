import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Bell,
    Calendar,
    CreditCard,
    Gift,
    Home,
    Mail,
    MessageCircle,
    Plus,
    Settings,
    User,
} from "lucide-react";

export default function CardDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Card 基本卡片</h2>
      <div className="flex gap-4 flex-wrap">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Basic Card</CardTitle>
            <CardDescription>This is a basic card example.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Cards can contain various types of content, including text, images, and interactive elements.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary">Close</Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Card with Action 带动作的卡片</h2>
      <div className="flex gap-4 flex-wrap">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Profile Card</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>John Doe</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>john@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Card with Form 表单卡片</h2>
      <div className="flex gap-4 flex-wrap">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Create Project</CardTitle>
            <CardDescription>Add a new project to manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input id="project-name" placeholder="Name of your project" />
              </div>
              <div>
                <Label htmlFor="project-desc">Description</Label>
                <Input id="project-desc" placeholder="Short description" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Create Project</Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Navigation Card 导航卡片</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="items-center">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Manage your notification preferences
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Configure
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="items-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <Settings className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Customize your application
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Open
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="items-center">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Manage payment methods
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Plans
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="items-center">
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
              <Gift className="h-6 w-6 text-orange-600 dark:text-orange-300" />
            </div>
            <CardTitle>Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Special deals and promotions
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Browse
            </Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Interactive Card 交互式卡片</h2>
      <div className="flex gap-4 flex-wrap">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Event Reminder</CardTitle>
            <CardDescription>Upcoming events this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="font-medium">Team Meeting</p>
                  <p className="text-sm text-muted-foreground">Today, 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-green-100 p-2 dark:bg-green-900">
                  <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="font-medium">Client Call</p>
                  <p className="text-sm text-muted-foreground">Tomorrow, 2:30 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900">
                  <Plus className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="font-medium">New Project</p>
                  <p className="text-sm text-muted-foreground">Friday, 11:00 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Events
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}