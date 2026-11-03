// src/pages/component/display/accordion.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AccordionDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Accordion 基础手风琴</h2>
      <div className="w-full max-w-md">
        <Accordion className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
              Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>
              Yes. It comes with default styles that matches the other components' aesthetic.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Is it animated?</AccordionTrigger>
            <AccordionContent>
              Yes. It's animated by default, but you can disable it if you prefer.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <h2 className="text-xl font-bold">Multiple Expandable Accordion 可多选展开手风琴</h2>
      <div className="w-full max-w-md">
        <Accordion multiple className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is a good API?</AccordionTrigger>
            <AccordionContent>
              A good API is like a good joke. If you have to explain it, it's not that good.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Why do Java developers wear glasses?</AccordionTrigger>
            <AccordionContent>
              Because they don't C#! (Or because the light from screens is too bright, in which case it's a good idea to take breaks.)
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How do you comfort a JavaScript bug?</AccordionTrigger>
            <AccordionContent>
              You console it! Also, sometimes you just need to take a break, grab some coffee, and come back with fresh eyes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Why did the developer go broke?</AccordionTrigger>
            <AccordionContent>
              Because he used up all his cache. (And forgot to save his work, probably.)
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <h2 className="text-xl font-bold">Custom Styling 自定义样式</h2>
      <div className="w-full max-w-md">
        <Accordion className="w-full">
          <AccordionItem value="item-1" className="border rounded-lg mb-2">
            <AccordionTrigger className="px-4 py-3 text-left font-semibold hover:no-underline">
              Custom Trigger Style
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              This accordion item has custom styling applied to both trigger and content.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border rounded-lg mb-2">
            <AccordionTrigger className="px-4 py-3 text-left font-semibold hover:no-underline">
              Another Custom Item
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              You can customize the appearance of each accordion item individually.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <h2 className="text-xl font-bold">Long Content 长内容</h2>
      <div className="w-full max-w-md">
        <Accordion className="w-full">
          <AccordionItem value="long-content">
            <AccordionTrigger>Click to expand long content</AccordionTrigger>
            <AccordionContent>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p className="mt-2">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              <p className="mt-2">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}