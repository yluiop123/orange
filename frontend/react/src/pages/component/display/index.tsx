import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
import SegmentedPage from './segmented';
const AvatarPage = lazy(() => import('./avatar'));
const BadgePage = lazy(() => import('./badge'));
const CalendarPage = lazy(() => import('./calendar'));
const CardPage = lazy(() => import('./card'));
const CarouselPage = lazy(() => import('./carousel'));
const AccordionPage = lazy(() => import('./accordion'));
const DescriptionsPage = lazy(() => import('./descriptions'));
const EmptyPage = lazy(() => import('./empty'));
const ImagePage = lazy(() => import('./image'));
const PopoverPage = lazy(() => import('./popover'));
const QRCodePage = lazy(() => import('./qrcode'));
const TagPage = lazy(() => import('./tag'));
const TimelinePage = lazy(() => import('./timeline'));
const TooltipPage = lazy(() => import('./tooltip'));
const TourPage = lazy(() => import('./tour'));
// const TreePage = lazy(() => import('./tree'));
export default function Display() {
  return (
    <Tabs defaultValue="avatar" className="p-3">
      <TabsList>
        <TabsTrigger value="avatar">Avatar</TabsTrigger>
        <TabsTrigger value="badge">Badge</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="card">Card</TabsTrigger>
        <TabsTrigger value="carousel">Carousel</TabsTrigger>
        <TabsTrigger value="accordion">Accordion</TabsTrigger>
        <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="image">Image</TabsTrigger>
        <TabsTrigger value="popover">Popover</TabsTrigger>
        <TabsTrigger value="qrcode">QRCode</TabsTrigger>
        <TabsTrigger value="segmented">Segmented</TabsTrigger>
        <TabsTrigger value="tag">Tag</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="tooltip">Tooltip</TabsTrigger>
        <TabsTrigger value="tour">Tour</TabsTrigger>
        {/* <TabsTrigger value="tree">Tree</TabsTrigger> */}
      </TabsList>
      <TabsContent value="avatar">
        <AvatarPage />
      </TabsContent>
      <TabsContent value="badge">
        <BadgePage />
      </TabsContent>
      <TabsContent value="calendar">
        <CalendarPage />
      </TabsContent>
      <TabsContent value="card">
        <CardPage />
      </TabsContent>
      <TabsContent value="carousel">
        <CarouselPage />
      </TabsContent>
      <TabsContent value="accordion">
        <AccordionPage />
      </TabsContent>
      <TabsContent value="descriptions">
        <DescriptionsPage />
      </TabsContent>
      <TabsContent value="empty">
        <EmptyPage />
      </TabsContent>
      <TabsContent value="image">
        <ImagePage />
      </TabsContent>
      <TabsContent value="popover">
        <PopoverPage />
      </TabsContent>
      <TabsContent value="qrcode">
        <QRCodePage />
      </TabsContent>
      <TabsContent value="segmented">
        <SegmentedPage />
      </TabsContent>
      <TabsContent value="tag">
        <TagPage />
      </TabsContent>
      <TabsContent value="timeline">
        <TimelinePage />
      </TabsContent>
      <TabsContent value="tooltip">
        <TooltipPage />
      </TabsContent>
      <TabsContent value="tour">
        <TourPage />
      </TabsContent>
      {/* <TabsContent value="tree">
        <TreePage />
      </TabsContent> */}
    </Tabs>
  );
}