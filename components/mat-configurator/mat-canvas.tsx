"use client"

import { useEffect, useRef } from "react"
import type { MatConfig } from "@/lib/mat-config"

type MatCanvasProps = {
  config: MatConfig
  onLogoUpdate?: (updates: Partial<MatConfig["logo"]>) => void
}

export function MatCanvas({ config }: MatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = 900
    const height = 520

    canvas.width = width
    canvas.height = height

    // Background
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "#2f2f2f"
    ctx.fillRect(0, 0, width, height)

    // Border / mat edge
    ctx.strokeStyle = "#111111"
    ctx.lineWidth = 18
    ctx.strokeRect(9, 9, width - 18, height - 18)

    // Optional logo
    if (config.logo?.dataUrl) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const scale = config.logo.scale || 1
        const targetWidth = 220 * scale
        const ratio = img.height / img.width
        const targetHeight = targetWidth * ratio

        const x = (width - targetWidth) * (config.logo.position?.x ?? 0.5)
        const y = (height - targetHeight) * (config.logo.position?.y ?? 0.5)

        ctx.save()
        ctx.translate(x + targetWidth / 2, y + targetHeight / 2)
        ctx.rotate(((config.logo.rotation || 0) * Math.PI) / 180)
        ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight)
        ctx.restore()
      }
      img.src = config.logo.dataUrl
    }
  }, [config])

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        id="carpetz-mat-preview-canvas"
        ref={canvasRef}
        data-mat-canvas="true"
        className="max-w-full h-auto border border-border"
      />
    </div>
  )
}
``
