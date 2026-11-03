import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import * as React from "react";

export default function CarouselDemo() {
  // Autoplay plugin initialization
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Carousel 基本轮播图</h2>
      <div className="max-w-md mx-auto">
        <Carousel className="w-full max-w-xs">
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-video items-center justify-center p-6">
                      <span className="text-4xl font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <h2 className="text-xl font-bold">Carousel with Navigation 带导航的轮播图</h2>
      <div className="max-w-md mx-auto">
        <Carousel className="w-full max-w-sm">
          <CarouselContent>
            {Array.from({ length: 4 }).map((_, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">Slide {index + 1}</div>
                        <p className="text-sm text-muted-foreground">This is slide {index + 1} of the carousel</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <h2 className="text-xl font-bold">Autoplay Carousel 自动播放轮播图</h2>
      <div className="max-w-lg mx-auto">
        <Carousel 
          className="w-full" 
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {[
              { title: "Beautiful Landscape", desc: "Enjoy the view of mountains and valleys" },
              { title: "Ocean Waves", desc: "Feel the calmness of the ocean" },
              { title: "City Skyline", desc: "Experience urban life at its finest" },
              { title: "Forest Path", desc: "Discover nature's secret trails" },
            ].map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-video items-center justify-center p-6 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-sm">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <h2 className="text-xl font-bold">Image Carousel 图片轮播</h2>
      <div className="max-w-xl mx-auto">
        <Carousel className="w-full">
          <CarouselContent>
            {[
              { src: "https://picsum.photos/600/300?random=1", title: "Nature Scene 1" },
              { src: "https://picsum.photos/600/300?random=2", title: "Nature Scene 2" },
              { src: "https://picsum.photos/600/300?random=3", title: "Nature Scene 3" },
              { src: "https://picsum.photos/600/300?random=4", title: "Nature Scene 4" },
            ].map((image, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative aspect-video">
                        <img 
                          src={image.src} 
                          alt={image.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 className="text-white font-bold">{image.title}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <h2 className="text-xl font-bold">Size Carousel 不同尺寸轮播</h2>
      <div className="space-y-4">
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-semibold mb-2">Small Size</h3>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3">
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-2">
                        <span className="text-lg font-semibold">Small {index + 1}</span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        
        <div className="max-w-lg mx-auto">
          <h3 className="text-lg font-semibold mb-2">Medium Size</h3>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/2">
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-video items-center justify-center p-4">
                        <span className="text-xl font-semibold">Medium {index + 1}</span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>

      <h2 className="text-xl font-bold">Vertical Carousel 纵向轮播</h2>
      <div className="max-w-xs mx-auto">
        <Carousel
          orientation="vertical"
          className="w-full max-w-xs h-[400px]"
        >
          <CarouselContent className="-mt-1 h-[400px]">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index} className="pt-1 h-full">
                <div className="p-1 h-full">
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="flex items-center justify-center p-6">
                      <span className="text-3xl font-semibold">Vertical {index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="!top-4 !translate-y-0 !-left-8" />
          <CarouselNext className="!top-16 !translate-y-0 !-left-8" />
        </Carousel>
      </div>

      <h2 className="text-xl font-bold">Multiple Items Carousel 多项轮播</h2>
      <div className="max-w-4xl mx-auto">
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-video items-center justify-center p-6">
                      <span className="text-2xl font-semibold">Item {index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}