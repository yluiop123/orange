import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
const DividerPage  = lazy(() => import('./divide'));
const FlexPage = lazy(() => import('./flex'));
const GridPage = lazy(() => import('./grid'));
const LayoutPage = lazy(() => import('./layout'));
const SpacePage = lazy(() => import('./space'));
const ResizablePage = lazy(() => import('./resizable'));
export default function Layout() {
  return (
        <Tabs defaultValue="divider" className="p-3">
            <TabsList >
                <TabsTrigger value="divider">Divider</TabsTrigger>            
                <TabsTrigger value="flex">Flex</TabsTrigger>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="space">Space</TabsTrigger>
                <TabsTrigger value="resizable">Resizable</TabsTrigger>
            </TabsList>
             <TabsContent value="divider">
                <DividerPage />
            </TabsContent>
             <TabsContent value="flex">
                <FlexPage />
            </TabsContent>
             <TabsContent value="grid">
                <GridPage />
            </TabsContent>
             <TabsContent value="layout">
                <LayoutPage />
            </TabsContent>
             <TabsContent value="space">
                <SpacePage />
            </TabsContent>
            <TabsContent value="resizable">
                <ResizablePage />
            </TabsContent>
        </Tabs>
  );
}