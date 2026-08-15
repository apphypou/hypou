import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type TouchEvent } from "react";
import { RotateCcw, X } from "lucide-react";
import { clampCropOffset } from "@/lib/mediaFrame";

type CropPreset = "original" | "portrait" | "square" | "landscape";

const CROP_PRESETS: Record<Exclude<CropPreset, "original">, { label: string; ratio: number }> = {
  portrait: { label: "4:5", ratio: 4 / 5 },
  square: { label: "1:1", ratio: 1 },
  landscape: { label: "16:9", ratio: 16 / 9 },
};

const MAX_ZOOM = 4;

interface FocalPointEditorProps {
  open: boolean;
  imageFile: File | null;
  imageUrl: string | null;
  onClose: () => void;
  onSave: (file: File) => void;
}

type TouchPoint = Pick<Touch, "clientX" | "clientY">;

const getTouchDistance = (first: TouchPoint, second: TouchPoint) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

const getOutputSize = (ratio: number) =>
  ratio >= 1
    ? { width: 1600, height: Math.round(1600 / ratio) }
    : { width: Math.round(1600 * ratio), height: 1600 };

export const FocalPointEditor = ({ open, imageFile, imageUrl, onClose, onSave }: FocalPointEditorProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef({ pointerId: -1, x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const pinchRef = useRef({ distance: 0, zoom: 1, active: false });
  const [preset, setPreset] = useState<CropPreset>("portrait");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [saving, setSaving] = useState(false);

  const ratio = preset === "original"
    ? imageSize.width && imageSize.height ? imageSize.width / imageSize.height : 4 / 5
    : CROP_PRESETS[preset].ratio;

  const constrainOffset = (x: number, y: number, nextZoom = zoom) => {
    const stage = stageRef.current;
    if (!stage || !imageSize.width || !imageSize.height) return { x: 0, y: 0 };
    return clampCropOffset({
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      viewportWidth: stage.clientWidth,
      viewportHeight: stage.clientHeight,
      zoom: nextZoom,
      x,
      y,
    });
  };

  const resetCrop = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!open) return;
    setPreset("portrait");
    setImageSize({ width: 0, height: 0 });
    resetCrop();
  }, [open, imageUrl]);

  if (!open || !imageUrl || !imageFile) return null;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pinchRef.current.active) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setIsAdjusting(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pinchRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
    setOffset(constrainOffset(
      dragRef.current.offsetX + event.clientX - dragRef.current.x,
      dragRef.current.offsetY + event.clientY - dragRef.current.y,
    ));
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === event.pointerId) dragRef.current.pointerId = -1;
    if (!pinchRef.current.active) setIsAdjusting(false);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;
    pinchRef.current = {
      distance: getTouchDistance(event.touches[0], event.touches[1]),
      zoom,
      active: true,
    };
    setIsAdjusting(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchRef.current.active) return;
    event.preventDefault();
    const distance = getTouchDistance(event.touches[0], event.touches[1]);
    const nextZoom = Math.min(MAX_ZOOM, Math.max(1, pinchRef.current.zoom * (distance / pinchRef.current.distance)));
    setZoom(nextZoom);
    setOffset((current) => constrainOffset(current.x, current.y, nextZoom));
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchRef.current.active = false;
      setIsAdjusting(false);
    }
  };

  const saveCrop = async () => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image || !image.naturalWidth || !image.naturalHeight) return;

    setSaving(true);
    try {
      const stageWidth = stage.clientWidth;
      const stageHeight = stage.clientHeight;
      const imageScale = Math.max(stageWidth / image.naturalWidth, stageHeight / image.naturalHeight) * zoom;
      const imageLeft = (stageWidth - image.naturalWidth * imageScale) / 2 + offset.x;
      const imageTop = (stageHeight - image.naturalHeight * imageScale) / 2 + offset.y;
      const sourceX = -imageLeft / imageScale;
      const sourceY = -imageTop / imageScale;
      const sourceWidth = stageWidth / imageScale;
      const sourceHeight = stageHeight / imageScale;
      const output = getOutputSize(ratio);
      const canvas = document.createElement("canvas");
      canvas.width = output.width;
      canvas.height = output.height;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, output.width, output.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) return;

      const filename = `${imageFile.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`;
      onSave(new File([blob], filename, { type: "image/jpeg", lastModified: Date.now() }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#111315] text-foreground" data-pull-refresh-disabled="true">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 pt-[calc(var(--safe-area-top)+0.75rem)] pb-3">
        <button type="button" onClick={onClose} className="justify-self-start p-2 text-sm font-semibold text-foreground/75" aria-label="Cancelar ajuste">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-[15px] font-bold">Ajustar foto</h2>
        <button type="button" onClick={() => void saveCrop()} disabled={saving} className="justify-self-end rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground disabled:opacity-50">
          {saving ? "Salvando" : "Concluir"}
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-5 pb-[calc(var(--safe-area-bottom)+1rem)]">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div
            ref={stageRef}
            className="relative w-full max-w-[28rem] touch-none select-none overflow-hidden rounded-[1.35rem] bg-black shadow-[0_18px_48px_rgba(0,0,0,0.38)]"
            style={{ aspectRatio: ratio }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="absolute inset-0" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Prévia da foto"
                className="h-full w-full object-cover"
                style={{ transform: `scale(${zoom})` }}
                onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                draggable={false}
              />
            </div>
            {isAdjusting && (
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => <div key={index} className="border border-white/35" />)}
              </div>
            )}
          </div>
        </div>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/55">Proporção</span>
            <button type="button" onClick={resetCrop} className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/65">
              <RotateCcw className="h-3.5 w-3.5" />
              Redefinir
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["original", "square", "portrait", "landscape"] as CropPreset[]).map((option) => {
              const label = option === "original" ? "Original" : CROP_PRESETS[option].label;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={preset === option}
                  onClick={() => {
                    setPreset(option);
                    resetCrop();
                  }}
                  className={`h-11 rounded-xl border text-xs font-bold transition ${
                    preset === option ? "border-primary bg-primary/15 text-primary" : "border-foreground/10 bg-card/45 text-foreground/65"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
