import { useEffect, useRef, useState, type Touch, type TouchEvent } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cdnFull } from "@/lib/imageUrl";

export type MediaViewerItem = {
  url: string;
  type?: "image" | "video";
  alt?: string;
};

interface MediaViewerDialogProps {
  media: MediaViewerItem | null;
  onOpenChange: (open: boolean) => void;
}

const isVideoUrl = (url: string) => /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url);
const MAX_ZOOM = 4;

type Zoom = {
  scale: number;
  x: number;
  y: number;
};

const getTouchDistance = (first: Touch, second: Touch) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

const clampZoom = (scale: number) => Math.min(MAX_ZOOM, Math.max(1, scale));

const clampPan = (value: number, viewportSize: number, scale: number) => {
  const limit = (viewportSize * (scale - 1)) / 2;
  return Math.min(limit, Math.max(-limit, value));
};

const MediaViewerDialog = ({ media, onOpenChange }: MediaViewerDialogProps) => {
  const open = !!media;
  const type = media?.type || (media?.url && isVideoUrl(media.url) ? "video" : "image");
  const [zoom, setZoom] = useState<Zoom>({ scale: 1, x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const gestureRef = useRef({
    pinchDistance: 0,
    pinchScale: 1,
    panStartX: 0,
    panStartY: 0,
    panOriginX: 0,
    panOriginY: 0,
  });

  const updateZoom = (next: Zoom) => {
    zoomRef.current = next;
    setZoom(next);
  };

  useEffect(() => {
    updateZoom({ scale: 1, x: 0, y: 0 });
  }, [media?.url]);

  const handleImageTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      gestureRef.current.pinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
      gestureRef.current.pinchScale = zoomRef.current.scale;
      return;
    }

    if (event.touches.length === 1 && zoomRef.current.scale > 1) {
      gestureRef.current.panStartX = event.touches[0].clientX;
      gestureRef.current.panStartY = event.touches[0].clientY;
      gestureRef.current.panOriginX = zoomRef.current.x;
      gestureRef.current.panOriginY = zoomRef.current.y;
    }
  };

  const handleImageTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && gestureRef.current.pinchDistance > 0) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      const scale = clampZoom(gestureRef.current.pinchScale * (distance / gestureRef.current.pinchDistance));
      updateZoom({ ...zoomRef.current, scale });
      return;
    }

    if (event.touches.length === 1 && zoomRef.current.scale > 1) {
      event.preventDefault();
      const scale = zoomRef.current.scale;
      const x = gestureRef.current.panOriginX + event.touches[0].clientX - gestureRef.current.panStartX;
      const y = gestureRef.current.panOriginY + event.touches[0].clientY - gestureRef.current.panStartY;
      updateZoom({
        scale,
        x: clampPan(x, window.innerWidth, scale),
        y: clampPan(y, window.innerHeight, scale),
      });
    }
  };

  const handleImageTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) gestureRef.current.pinchDistance = 0;
    if (event.touches.length === 0 && zoomRef.current.scale < 1.05) {
      updateZoom({ scale: 1, x: 0, y: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="fixed inset-0 left-0 top-0 z-[220] h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-black p-0 shadow-none [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Visualização de mídia</DialogTitle>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-[calc(var(--safe-area-top)+1rem)] z-20 h-10 w-10 rounded-full bg-white/12 text-white backdrop-blur-xl border border-white/15 flex items-center justify-center"
          aria-label="Fechar mídia"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className="flex h-full w-full items-center justify-center overflow-hidden px-0 touch-none"
          onTouchStart={type === "image" ? handleImageTouchStart : undefined}
          onTouchMove={type === "image" ? handleImageTouchMove : undefined}
          onTouchEnd={type === "image" ? handleImageTouchEnd : undefined}
          onTouchCancel={type === "image" ? handleImageTouchEnd : undefined}
        >
          {media && type === "video" ? (
            <video
              src={media.url}
              className="max-h-full max-w-full object-contain"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
          ) : media ? (
            <img
              src={cdnFull(media.url)}
              alt={media.alt || "Mídia"}
              className="max-h-full max-w-full object-contain select-none will-change-transform"
              style={{ transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})` }}
              draggable={false}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewerDialog;
