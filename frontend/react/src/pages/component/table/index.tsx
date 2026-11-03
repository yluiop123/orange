import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
const BasicPage = lazy(() => import('./basic'));
const HeaderGroupsPage = lazy(() => import('./header-groups'));
const FiltersPage = lazy(() => import('./filters'));
const FacetedFiltersPage = lazy(() => import('./filters-faceted'));
const FiltersFuzzyPage = lazy(() => import('./filters-fuzzy'));
const ColumnOrderingPage = lazy(() => import('./column-ordering'));
const ColumnDndPage = lazy(() => import('./column-dnd'));
export default function General() {
  return (
        <Tabs defaultValue="static" className="p-3">
            <TabsList >
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="header-groups">Header Groups</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="filters-faceted">Faceted Filters</TabsTrigger>
                <TabsTrigger value="filters-fuzzy">Fuzzy Filters</TabsTrigger>
                <TabsTrigger value="column-ordering">Column Ordering</TabsTrigger>
                <TabsTrigger value="column-dnd">Column DnD</TabsTrigger>
            </TabsList>
             <TabsContent value="basic">
                <BasicPage />
            </TabsContent>
             <TabsContent value="header-groups">
                <HeaderGroupsPage />
            </TabsContent>
             <TabsContent value="filters">
                <FiltersPage />
            </TabsContent>
             <TabsContent value="filters-faceted">
                <FacetedFiltersPage />
            </TabsContent>
             <TabsContent value="filters-fuzzy">
                <FiltersFuzzyPage />
            </TabsContent>
             <TabsContent value="column-ordering">
                <ColumnOrderingPage />
            </TabsContent>
             <TabsContent value="column-dnd">
                <ColumnDndPage />
            </TabsContent>
        </Tabs>
  );
}