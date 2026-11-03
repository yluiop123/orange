"use client"

import { cn } from "@/lib/utils"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"
import * as React from "react"

// 重点：从库中直接提取 Props 类型，确保 100% 兼容
type QRProps = React.ComponentPropsWithoutRef<typeof QRCodeSVG>

interface QRCodeComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: "L" | "M" | "Q" | "H"
  includeMargin?: boolean
  renderAs?: "svg" | "canvas"
  imageSettings?: QRProps["imageSettings"] // 使用库内置的 imageSettings 类型
}

const QRCode = React.forwardRef<HTMLDivElement, QRCodeComponentProps>(
  (
    {
      value,
      size = 128,
      bgColor = "#ffffff",
      fgColor = "#000000",
      level = "M",
      includeMargin = false,
      renderAs = "svg",
      imageSettings,
      className,
      ...props
    },
    ref
  ) => {
    // 将二维码需要的属性聚合
    const qrConfig = {
      value,
      size,
      bgColor,
      fgColor,
      level,
      includeMargin,
      imageSettings,
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-lg border bg-white p-2 shadow-sm",
          className
        )}
        {...props}
      >
        {renderAs === "svg" ? (
          <QRCodeSVG {...qrConfig} />
        ) : (
          <QRCodeCanvas {...qrConfig} />
        )}
      </div>
    )
  }
)

QRCode.displayName = "QRCode"

export { QRCode }
