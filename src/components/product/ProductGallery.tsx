"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: string[]
}

const SWIPE_THRESHOLD = 40
const TAP_THRESHOLD = 10
const ZOOM_LEVELS = [1, 1.5, 2, 3] as const

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })

  /* ── Lightbox state ── */
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxVisible, setLightboxVisible] = useState(false)

  /* ── Lightbox zoom state ── */
  const [lightboxZoom, setLightboxZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  /* ── Touch/pointer refs ── */
  const suppressMobileClickRef = useRef(false)
  const suppressLightboxClickRef = useRef(false)
  const lightboxOpenedAtRef = useRef(0)

  const galleryGestureRef = useRef({ startX: 0, startY: 0, endX: 0, endY: 0 })
  const lightboxGestureRef = useRef({ startX: 0, startY: 0, endX: 0, endY: 0 })

  const activeImage = images[activeIndex]

  /* ═══════════ Lightbox open/close ═══════════ */
  const openLightbox = useCallback(() => {
    suppressLightboxClickRef.current = true
    lightboxOpenedAtRef.current = Date.now()
    setLightboxZoom(1)
    setPanOffset({ x: 0, y: 0 })
    setLightboxOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLightboxVisible(true)
      })
    })
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false)
    window.setTimeout(() => {
      setLightboxOpen(false)
      setLightboxZoom(1)
      setPanOffset({ x: 0, y: 0 })
    }, 250)
  }, [])

  /* ═══════════ Lightbox zoom controls ═══════════ */
  const handleZoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxZoom((prev) => {
      const currentIdx = ZOOM_LEVELS.indexOf(prev as typeof ZOOM_LEVELS[number])
      if (currentIdx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[currentIdx + 1]
      return prev
    })
  }, [])

  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxZoom((prev) => {
      const currentIdx = ZOOM_LEVELS.indexOf(prev as typeof ZOOM_LEVELS[number])
      if (currentIdx > 0) {
        const newZoom = ZOOM_LEVELS[currentIdx - 1]
        if (newZoom === 1) setPanOffset({ x: 0, y: 0 })
        return newZoom
      }
      return prev
    })
  }, [])

  const handleZoomReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  /* ═══════════ Pan handlers (when zoomed) ═══════════ */
  const onImagePointerDown = useCallback((e: React.PointerEvent) => {
    if (lightboxZoom <= 1) return
    e.stopPropagation()
    e.preventDefault()
    isPanningRef.current = true
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: panOffset.x,
      offsetY: panOffset.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [lightboxZoom, panOffset])

  const onImagePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    e.stopPropagation()
    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y
    setPanOffset({
      x: panStartRef.current.offsetX + dx,
      y: panStartRef.current.offsetY + dy,
    })
  }, [])

  const onImagePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    e.stopPropagation()
    isPanningRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  /* ═══════════ Navigation ═══════════ */
  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setLightboxZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }, [images.length])

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setLightboxZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }, [images.length])

  /* ── Keyboard support ── */
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox()
        return
      }
      if (event.key === "ArrowLeft") goToPrev()
      if (event.key === "ArrowRight") goToNext()
      if (event.key === "+" || event.key === "=") {
        setLightboxZoom((prev) => {
          const idx = ZOOM_LEVELS.indexOf(prev as typeof ZOOM_LEVELS[number])
          return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : prev
        })
      }
      if (event.key === "-") {
        setLightboxZoom((prev) => {
          const idx = ZOOM_LEVELS.indexOf(prev as typeof ZOOM_LEVELS[number])
          if (idx > 0) {
            const nz = ZOOM_LEVELS[idx - 1]
            if (nz === 1) setPanOffset({ x: 0, y: 0 })
            return nz
          }
          return prev
        })
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [closeLightbox, goToNext, goToPrev, lightboxOpen])

  /* ── Desktop hover zoom ── */
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - left) / width) * 100
    const y = ((event.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  /* ═══════════ Gallery pointer handlers ═══════════ */
  const onGalleryPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return
    galleryGestureRef.current = {
      startX: event.clientX, startY: event.clientY,
      endX: event.clientX, endY: event.clientY,
    }
  }
  const onGalleryPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return
    galleryGestureRef.current.endX = event.clientX
    galleryGestureRef.current.endY = event.clientY
  }
  const onGalleryPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return
    suppressMobileClickRef.current = false
    const { startX, startY, endX, endY } = galleryGestureRef.current
    const diffX = startX - endX
    const diffY = startY - endY
    if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
      suppressMobileClickRef.current = true
      if (diffX > 0) goToNext()
      else goToPrev()
      return
    }
    if (Math.abs(diffX) <= TAP_THRESHOLD && Math.abs(diffY) <= TAP_THRESHOLD) {
      openLightbox()
    }
  }
  const onGalleryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (suppressMobileClickRef.current) {
      suppressMobileClickRef.current = false
      return
    }
    if (!lightboxOpen) openLightbox()
  }

  /* ═══════════ Lightbox gesture handlers ═══════════ */
  const onLightboxPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return
    lightboxGestureRef.current = {
      startX: event.clientX, startY: event.clientY,
      endX: event.clientX, endY: event.clientY,
    }
  }
  const onLightboxPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return
    lightboxGestureRef.current.endX = event.clientX
    lightboxGestureRef.current.endY = event.clientY
  }
  const onLightboxPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return
    const { startX, startY, endX, endY } = lightboxGestureRef.current
    const diffX = startX - endX
    const diffY = startY - endY
    if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
      suppressLightboxClickRef.current = true
      if (diffX > 0) goToNext()
      else goToPrev()
    }
  }
  const onLightboxBackdropClick = () => {
    if (Date.now() - lightboxOpenedAtRef.current < 500) return
    if (suppressLightboxClickRef.current) {
      suppressLightboxClickRef.current = false
      return
    }
    closeLightbox()
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <>
      {/* ═══════════ MOBILE GALLERY (< lg) ═══════════ */}
      <div className="lg:hidden flex flex-col gap-3 min-w-0">
        <button
          type="button"
          className="relative w-full aspect-[3/4] bg-white/5 border border-white/10 overflow-hidden cursor-pointer block touch-pan-y"
          onPointerDown={onGalleryPointerDown}
          onPointerMove={onGalleryPointerMove}
          onPointerUp={onGalleryPointerUp}
          onClick={onGalleryClick}
          aria-label="Büyük resmi görüntüle"
        >
          <Image src={activeImage} alt="Product details" fill className="object-cover" sizes="100vw" priority />
          <span className="absolute bottom-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/55 backdrop-blur-sm text-white/80 pointer-events-none">
            <ZoomIn className="w-4 h-4" />
          </span>
          <span className="absolute top-3 right-3 z-10 bg-black/55 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full pointer-events-none">
            {activeIndex + 1} / {images.length}
          </span>
        </button>

        {/* Horizontal thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-1 min-w-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative shrink-0 snap-start w-16 h-20 overflow-hidden border-2 transition-all duration-200 rounded-sm cursor-pointer touch-manipulation",
                activeIndex === idx ? "border-white opacity-100" : "border-white/20 opacity-50 active:opacity-80"
              )}
              aria-label={`Görsel ${idx + 1}`}
            >
              <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover pointer-events-none" sizes="64px" />
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ DESKTOP GALLERY (>= lg) ═══════════ */}
      <div className="hidden lg:flex relative gap-6 w-full min-w-0">
        {/* Vertical thumbnails */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] shrink-0 w-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative shrink-0 w-full aspect-[3/4] overflow-hidden border transition-all duration-300 touch-manipulation",
                activeIndex === idx ? "border-white opacity-100" : "border-white/10 opacity-50 hover:opacity-100 hover:border-white/50"
              )}
              aria-label={`Görsel ${idx + 1}`}
            >
              <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover pointer-events-none" sizes="80px" />
            </button>
          ))}
        </div>

        {/* Main image with hover zoom */}
        <div
          className="relative w-full aspect-[3/4] bg-white/5 border border-white/10 cursor-crosshair group"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
          onClick={openLightbox}
        >
          <Image src={activeImage} alt="Product details" fill className="object-cover transition-opacity duration-500" sizes="50vw" priority />

          <div className="absolute bottom-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <ZoomIn className="w-4 h-4" />
          </div>

          {/* Desktop hover zoom panel — 30% extra zoom (250% → 325%) */}
          {isZooming && (
            <div
              className="absolute top-0 w-full h-full bg-white z-[60] border border-white/10 shadow-2xl pointer-events-none"
              style={{
                left: "calc(100% + 2rem)",
                backgroundImage: `url(${activeImage})`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundSize: "325%",
              }}
            />
          )}
        </div>
      </div>

      {/* ═══════════ FULL-SCREEN LIGHTBOX ═══════════ */}
      {lightboxOpen && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ease-in-out touch-pan-y",
            lightboxVisible ? "bg-black/95 backdrop-blur-md opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"
          )}
          onClick={onLightboxBackdropClick}
          onPointerDown={onLightboxPointerDown}
          onPointerMove={onLightboxPointerMove}
          onPointerUp={onLightboxPointerUp}
        >
          {/* ── Close button ── */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeLightbox() }}
            aria-label="Kapat"
            className="absolute top-4 right-4 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 active:bg-white/30 hover:bg-white/20 text-white transition-colors duration-200 touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>

          {/* ── Image counter ── */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[110] text-white/70 text-sm font-light tracking-widest pointer-events-none">
            {activeIndex + 1} / {images.length}
          </div>

          {/* ══════ ZOOM CONTROLS ══════ */}
          <div className="absolute bottom-20 md:bottom-24 right-4 md:right-8 z-[110] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={lightboxZoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              aria-label="Yakınlaştır"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation backdrop-blur-sm"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={lightboxZoom <= ZOOM_LEVELS[0]}
              aria-label="Uzaklaştır"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation backdrop-blur-sm"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              disabled={lightboxZoom === 1}
              aria-label="Sıfırla"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation backdrop-blur-sm"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            {/* Zoom level indicator */}
            <div className="text-center text-[10px] text-white/50 font-medium tracking-wide pointer-events-none">
              {lightboxZoom}x
            </div>
          </div>

          {/* ── Prev arrow ── */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToPrev() }}
              aria-label="Önceki"
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/10 active:bg-white/30 hover:bg-white/20 text-white transition-colors duration-200 touch-manipulation"
            >
              <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
            </button>
          )}

          {/* ── Lightbox Image (with zoom + pan) ── */}
          <div
            className={cn(
              "relative w-[92vw] h-[74vh] md:w-[80vw] md:h-[85vh] transition-all duration-300 ease-in-out overflow-hidden",
              lightboxVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
              lightboxZoom > 1 ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onImagePointerDown}
            onPointerMove={onImagePointerMove}
            onPointerUp={onImagePointerUp}
          >
            <Image
              src={activeImage}
              alt={`Product image ${activeIndex + 1}`}
              fill
              className="object-contain transition-transform duration-200 ease-out"
              sizes="92vw"
              draggable={false}
              style={{
                transform: `scale(${lightboxZoom}) translate(${panOffset.x / lightboxZoom}px, ${panOffset.y / lightboxZoom}px)`,
              }}
            />
          </div>

          {/* ── Next arrow ── */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToNext() }}
              aria-label="Sonraki"
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/10 active:bg-white/30 hover:bg-white/20 text-white transition-colors duration-200 touch-manipulation"
            >
              <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
            </button>
          )}

          {/* ── Bottom thumbnail strip ── */}
          {images.length > 1 && (
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[110] flex gap-2 max-w-[92vw] overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {images.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); setLightboxZoom(1); setPanOffset({ x: 0, y: 0 }) }}
                  className={cn(
                    "relative w-12 h-12 md:w-16 md:h-16 overflow-hidden border-2 transition-all duration-200 rounded-sm shrink-0 touch-manipulation",
                    activeIndex === idx ? "border-white opacity-100 scale-105" : "border-white/20 opacity-50 active:opacity-80 hover:opacity-80"
                  )}
                  aria-label={`Görsel ${idx + 1}`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover pointer-events-none" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
