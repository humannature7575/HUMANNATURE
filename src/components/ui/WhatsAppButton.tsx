"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWhatsApp } from "@/hooks/useWhatsApp";

export function WhatsAppIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const { whatsappUrl, phoneNumber } = useWhatsApp();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isDraggingRef = useRef(false);
  const startCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const BTN_SIZE = 60;
  const MARGIN = 20;

  useEffect(() => {
    const initPos = () => {
      if (typeof window !== "undefined") {
        setPosition((prev) => {
          if (!prev) {
            return {
              x: window.innerWidth - BTN_SIZE - MARGIN,
              y: window.innerHeight - BTN_SIZE - MARGIN - 20,
            };
          }
          return {
            x: Math.min(Math.max(MARGIN, prev.x), window.innerWidth - BTN_SIZE - MARGIN),
            y: Math.min(Math.max(MARGIN, prev.y), window.innerHeight - BTN_SIZE - MARGIN),
          };
        });
      }
    };

    initPos();
    window.addEventListener("resize", initPos);
    return () => window.removeEventListener("resize", initPos);
  }, []);

  const openWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } else if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent("Merhaba, bilgi almak istiyorum.")}`, "_blank", "noopener,noreferrer");
    } else {
      toast.info("WhatsApp numarası henüz girilmedi. Lütfen yönetim panelinden bir numara kaydediniz.");
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startCoordRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = position || {
      x: window.innerWidth - BTN_SIZE - MARGIN,
      y: window.innerHeight - BTN_SIZE - MARGIN - 20,
    };
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - startCoordRef.current.x;
      const dy = moveEvent.clientY - startCoordRef.current.y;

      if (Math.hypot(dx, dy) > 6) {
        hasMovedRef.current = true;
      }

      const maxX = window.innerWidth - BTN_SIZE - MARGIN;
      const maxY = window.innerHeight - BTN_SIZE - MARGIN;

      const newX = Math.min(Math.max(MARGIN, startPosRef.current.x + dx), maxX);
      const newY = Math.min(Math.max(MARGIN, startPosRef.current.y + dy), maxY);

      setPosition({ x: newX, y: newY });
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      // If the user did not drag, trigger the click action directly!
      if (!hasMovedRef.current) {
        openWhatsApp();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  if (!position) return null;

  return (
    <div
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: "none",
      }}
      className="fixed top-0 left-0 z-50 select-none group cursor-grab active:cursor-grabbing transition-shadow duration-300 will-change-transform"
      aria-label="WhatsApp İletişim Hattı"
    >
      {/* Pulse Rings */}
      <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping duration-1000 pointer-events-none" />
      <span className="absolute -inset-2 rounded-full bg-emerald-500/10 pointer-events-none" />

      {/* Floating Tooltip */}
      <div
        className={`absolute bottom-full mb-3 right-0 sm:right-1/2 sm:translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-neutral-900/95 text-white text-xs font-medium tracking-wide shadow-xl border border-white/10 backdrop-blur-sm pointer-events-none transition-all duration-200 ${
          showTooltip && !isDragging ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>WhatsApp Destek</span>
        </div>
        <div className="absolute top-full right-6 sm:right-1/2 sm:translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900/95" />
      </div>

      {/* WhatsApp Button */}
      <div
        role="button"
        tabIndex={0}
        className="relative flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        title="WhatsApp ile İletişime Geçin"
      >
        <WhatsAppIcon className="w-8 h-8 text-white drop-shadow-md" />

        {/* Online Status Badge */}
        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border-2 border-emerald-600" />
        </span>
      </div>
    </div>
  );
}
