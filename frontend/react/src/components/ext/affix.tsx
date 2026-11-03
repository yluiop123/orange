import { useEffect, useRef, useState } from "react"

interface AffixProps {
  offsetTop?: number
  offsetBottom?: number
  offsetLeft?: number
  offsetRight?: number
  position?: "top" | "bottom"
  children: React.ReactNode
  className?: string
}

export default function Affix({
  offsetTop = 0,
  offsetBottom = 0,
  offsetLeft,
  offsetRight,
  position = "top",
  children,
  className,
}: AffixProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const placeholderRef = useRef<HTMLDivElement | null>(null)
  const [fixed, setFixed] = useState(false)

  useEffect(() => {
    const placeholder = placeholderRef.current
    if (!placeholder) return

    const onScroll = () => {
      const rect = placeholder.getBoundingClientRect()
      if (position === "top") {
        setFixed(rect.top <= offsetTop)
      } else {
        // position === "bottom"
        setFixed(rect.bottom >= window.innerHeight - offsetBottom)
      }
    }

    onScroll()
    window.addEventListener("scroll", onScroll)
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [offsetTop, offsetBottom, position])

  const fixedStyle: React.CSSProperties | undefined = fixed
    ? position === "top"
      ? {
          position: "fixed",
          top: offsetTop,
          left: offsetLeft !== undefined ? offsetLeft : 0,
          right: offsetRight !== undefined ? offsetRight : 0,
          zIndex: 40,
        }
      : {
          position: "fixed",
          bottom: offsetBottom,
          left: offsetLeft !== undefined ? offsetLeft : 0,
          right: offsetRight !== undefined ? offsetRight : 0,
          zIndex: 40,
        }
    : undefined

  return (
    <>
      <div ref={placeholderRef} className="h-0"/>
      <div ref={ref} className={className} style={fixedStyle}>
        {children}
      </div>
    </>
  )
}
