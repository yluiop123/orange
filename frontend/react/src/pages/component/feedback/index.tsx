import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
const AlertPage = lazy(() => import('./alert'));
const DrawerPage = lazy(() => import('./drawer'));
const SonnerPage = lazy(() => import('./sonner'));
const AlertDialogPage = lazy(() => import('./alert-dialog'));
const DialogPage = lazy(() => import('./dialog'));
const ProgressPage = lazy(() => import('./progress'));
const ResultPage = lazy(() => import('./result'));
const SkeletonPage = lazy(() => import('./skeleton'));
const SpinnerPage = lazy(() => import('./spinner'));
const WatermarkPage = lazy(() => import('./watermark'));

export default function Feedback() {
  return (
        <Tabs defaultValue="alert" className="p-3">
            <TabsList >
                <TabsTrigger value="alert">Alert</TabsTrigger>
                <TabsTrigger value="drawer">Drawer</TabsTrigger>
                <TabsTrigger value="sonner">Sonner</TabsTrigger>
                <TabsTrigger value="alert-dialog">Alert Dialog</TabsTrigger>
                <TabsTrigger value="dialog">Dialog</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="result">Result</TabsTrigger>
                <TabsTrigger value="skeleton">Skeleton</TabsTrigger>
                <TabsTrigger value="spinner">Spinner</TabsTrigger>
                <TabsTrigger value="watermark">Watermark</TabsTrigger>
            </TabsList>
            <TabsContent value="alert">
                <AlertPage />
            </TabsContent>
            <TabsContent value="drawer">
                <DrawerPage />
            </TabsContent>
            <TabsContent value="sonner">
                <SonnerPage />
            </TabsContent>
            <TabsContent value="alert-dialog">
                <AlertDialogPage />
            </TabsContent>
            <TabsContent value="dialog">
                <DialogPage />
            </TabsContent>
            <TabsContent value="progress">
                <ProgressPage />
            </TabsContent>
            <TabsContent value="result">
                <ResultPage />
            </TabsContent>
            <TabsContent value="skeleton">
                <SkeletonPage />
            </TabsContent>
            <TabsContent value="spinner">
                <SpinnerPage />
            </TabsContent>
            <TabsContent value="watermark">
                <WatermarkPage />
            </TabsContent>
        </Tabs>
  );
}