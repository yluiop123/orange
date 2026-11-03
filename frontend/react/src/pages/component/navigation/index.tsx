import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
const AnchorPage = lazy(() => import('./anchor'));
const BreadcrumbPage = lazy(() => import('./breadcrumb'));
const DropdownPage = lazy(() => import('./dropdown'));
const ContextMenuPage = lazy(() => import('./context-menu'));
const SidebarPage = lazy(() => import('./sidebar'));
const NavigationMenuPage = lazy(() => import('./navigation-menu'));
const PaginationPage = lazy(() => import('./pagination'));
const StepsPage = lazy(() => import('./steps'));
const TabsDemoPage = lazy(() => import('./tabs'));
export default function General() {
  return (
        <Tabs defaultValue="anchor" className="p-3">
            <TabsList >
                <TabsTrigger value="anchor">Anchor</TabsTrigger>
                <TabsTrigger value="breadcrumb">Breadcrumb</TabsTrigger>
                <TabsTrigger value="dropdown">Dropdown</TabsTrigger>
                <TabsTrigger value="contextMenu">ContextMenu</TabsTrigger>
                <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
                <TabsTrigger value="navigationMenu">NavigationMenu</TabsTrigger>
                <TabsTrigger value="pagination">Pagination</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="tabs">Tabs</TabsTrigger>
            </TabsList>
             <TabsContent value="anchor">
                <AnchorPage />
            </TabsContent>
             <TabsContent value="breadcrumb">
                <BreadcrumbPage />
            </TabsContent>
             <TabsContent value="dropdown">
                <DropdownPage />
            </TabsContent>
             <TabsContent value="contextMenu">
                <ContextMenuPage />
            </TabsContent>
             <TabsContent value="sidebar">
                <SidebarPage />
            </TabsContent>
             <TabsContent value="navigationMenu">
                <NavigationMenuPage />
            </TabsContent>
             <TabsContent value="pagination">
                <PaginationPage />
            </TabsContent>
             <TabsContent value="steps">
                <StepsPage />
            </TabsContent>
             <TabsContent value="tabs">
                <TabsDemoPage />
            </TabsContent>
        </Tabs>
  );
}