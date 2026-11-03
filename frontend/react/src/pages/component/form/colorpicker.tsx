"use client"

import { ColorPicker } from "@/components/ext/colorpicker"
import { useState } from "react"

export default function ColorPickerDemo() {
  const [color, setColor] = useState("#3b82f6")

  return (
    <div className="p-10 space-y-4">
      <h2 className="text-sm font-medium">背景颜色设置 (Background Setting)</h2>
      <ColorPicker color={color} onChange={setColor} />
      
      <div 
        className="w-full h-20 rounded-lg border transition-all duration-500"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center justify-center h-full text-white font-bold drop-shadow-md">
          {color}
        </div>
      </div>
    </div>
  )
}