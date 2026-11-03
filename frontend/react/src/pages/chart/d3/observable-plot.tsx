import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";
export default function PlotCart({plot}:{plot:(SVGSVGElement | HTMLElement) & Plot.Plot}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (plot === undefined) return;
    containerRef.current?.append(plot);
    return () => plot.remove();
  }, [plot]);

  return <div ref={containerRef} />;
}