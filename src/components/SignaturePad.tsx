"use client";

/**
 * Canvas-based signature capture component.
 *
 * Works with mouse, touch (iPad in-store), and stylus input. Handles DPR
 * scaling so the signature is crisp on retina / high-dpi displays.
 *
 * On submit, returns the signature as a base64 PNG data URL plus a simple
 * metadata bundle (approximate stroke count, canvas dimensions, and the
 * current ISO timestamp). The caller is responsible for stamping the
 * ESIGN/UETA consent + signer identity before persisting.
 *
 * Usage:
 *   <SignaturePad onSubmit={(png) => ...} onCancel={() => ...} />
 */

import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  /** Called with the base64 PNG data URL when the user clicks Submit. */
  onSubmit: (dataUrl: string, metadata: SignatureMetadata) => void;
  /** Called when the user clicks Cancel (e.g., to go back). */
  onCancel?: () => void;
  /** Canvas height — defaults to 200px. */
  height?: number;
  /** Label for the submit button. Defaults to "Done signing". */
  submitLabel?: string;
}

export interface SignatureMetadata {
  strokeCount: number;
  canvasWidthCss: number;
  canvasHeightCss: number;
  capturedAt: string;
}

export default function SignaturePad({
  onSubmit,
  onCancel,
  height = 200,
  submitLabel = "Done signing",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInk, setHasInk] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas to its CSS size * devicePixelRatio so ink is crisp.
  function sizeCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2.2;
    }
  }

  useEffect(() => {
    sizeCanvas();
    const onResize = () => {
      // Resizing clears the canvas — fine for a signature pad. User can
      // redraw if they rotated their phone mid-sign.
      sizeCanvas();
      setHasInk(false);
      setStrokeCount(0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  function pointerPos(e: PointerEvent | React.PointerEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = pointerPos(e);
    setStrokeCount((n) => n + 1);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = pointerPos(e);
    const last = lastPoint.current!;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPoint.current = { x, y };
    if (!hasInk) setHasInk(true);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    lastPoint.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    setHasInk(false);
    setStrokeCount(0);
  }

  function submit() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const rect = canvas.getBoundingClientRect();
    const dataUrl = canvas.toDataURL("image/png");
    onSubmit(dataUrl, {
      strokeCount,
      canvasWidthCss: Math.round(rect.width),
      canvasHeightCss: Math.round(rect.height),
      capturedAt: new Date().toISOString(),
    });
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative border-2 border-brand-gray-200 rounded-xl bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="block w-full touch-none cursor-crosshair rounded-xl"
          aria-label="Signature pad"
        />
        {!hasInk && (
          <p className="absolute inset-0 flex items-center justify-center text-brand-gray-400 pointer-events-none text-sm">
            Sign here with your finger, stylus, or mouse
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 justify-between">
        <button
          type="button"
          onClick={clearCanvas}
          className="text-sm text-brand-gray-600 hover:text-brand-gray-900 underline"
        >
          Clear and start over
        </button>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold border-2 border-brand-gray-200 rounded-lg hover:bg-brand-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!hasInk}
            className="px-5 py-2 text-sm font-semibold bg-brand-red text-white rounded-lg disabled:bg-brand-gray-300 disabled:cursor-not-allowed hover:bg-brand-red-dark"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
