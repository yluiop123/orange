"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  placement?: "top" | "bottom";
}

interface TourContextType {
  startTour: () => void;
  stop: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children, steps }: { children: React.ReactNode; steps: TourStep[] }) => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => setMounted(true), []);

  const startTour = () => {
    setCurrentStep(0);
    setOpen(true);
  };

  const stop = () => {
    setOpen(false);
    setRect(null);
  };

  const next = () => (currentStep < steps.length - 1 ? setCurrentStep(s => s + 1) : stop());
  const prev = () => (currentStep > 0 ? setCurrentStep(s => s - 1) : null);

  // 实时追踪目标位置并处理滚动
  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const el = document.getElementById(steps[currentStep].targetId);
      if (el) {
        const currentRect = el.getBoundingClientRect();
        setRect(currentRect);
        
        // 如果元素不在可视区，自动滚动过去
        const isInView = (
          currentRect.top >= 0 &&
          currentRect.bottom <= window.innerHeight
        );
        if (!isInView) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        console.error(`Tour Error: ID "${steps[currentStep].targetId}" not found!`);
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, currentStep, steps]);

  return (
    <TourContext.Provider value={{ startTour, stop }}>
      {children}
      {mounted && open && rect && createPortal(
        <div className="fixed inset-0 z-[99999] pointer-events-none">
          {/* SVG 遮罩层 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <mask id="tour-mask-main">
              <rect fill="white" width="100%" height="100%" />
              <motion.rect
                fill="black"
                animate={{
                  x: rect.left - 12,
                  y: rect.top - 12,
                  width: rect.width + 24,
                  height: rect.height + 24,
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                rx="12"
              />
            </mask>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask-main)" />
          </svg>

          {/* 提示气泡卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              left: rect.left + rect.width / 2,
              top: steps[currentStep].placement === "top" ? rect.top - 24 : rect.bottom + 24
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ 
              x: "-50%", 
              y: steps[currentStep].placement === "top" ? "-100%" : "0" 
            }}
            className="absolute w-80 bg-white p-6 rounded-2xl shadow-2xl pointer-events-auto border border-slate-200"
          >
            {/* 动态小箭头 */}
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45",
              steps[currentStep].placement === "top" 
                ? "-bottom-2 border-b border-r border-slate-200" 
                : "-top-2 border-t border-l border-slate-200"
            )} />

            <div className="relative space-y-4 text-left">
              <div>
                <h4 className="font-bold text-slate-900 text-lg leading-tight">
                  {steps[currentStep].title}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Step {currentStep + 1} / {steps.length}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {steps[currentStep].description}
              </p>

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={stop}
                  className="h-auto px-0 text-xs text-slate-400 hover:bg-transparent hover:text-slate-600"
                >
                  Skip (跳过)
                </Button>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" size="sm" onClick={prev} className="h-9 px-3 text-xs">
                      Back (上一步)
                    </Button>
                  )}
                  <Button size="sm" onClick={next} className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                    {currentStep === steps.length - 1 ? "Finish (完成)" : "Next (下一步)"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used within TourProvider");
  return context;
};