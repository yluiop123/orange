import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
const ButtonPage = lazy(() => import('./button'));
const FloatButtonPage = lazy(() => import('./float-button'));
const AffixPage = lazy(() => import('./affix'));
const TypographyPage = lazy(() => import('./typography'));
export default function General() {
  return (
        <Tabs defaultValue="button" className="p-3">
            <TabsList >
                <TabsTrigger value="button">Button</TabsTrigger>
                <TabsTrigger value="floatButton">FloatButton</TabsTrigger>
                <TabsTrigger value="affix">Affix</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
            </TabsList>
            <TabsContent value="button">
                <ButtonPage />
            </TabsContent>
             <TabsContent value="floatButton">
                <FloatButtonPage />
            </TabsContent>
             <TabsContent value="affix">
                <AffixPage />
            </TabsContent>
            <TabsContent value="typography">
                <TypographyPage />
            </TabsContent>
        </Tabs>
  );
}