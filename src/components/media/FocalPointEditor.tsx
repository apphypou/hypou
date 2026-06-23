import { useEffect, useRef, useState } from "react";
import { Check, Move, X } from "lucide-react";
import { clampPercent, DEFAULT_FOCAL_POINT } from "@/lib/mediaFrame";

export type FocalPoint = {
  focal_x: number;
  focal_y: number;
};

interface FocalPointEditorProps {
  open: boolean;
  imageUrl: string | null;
  value?: Partial<FocalPoint> | null;
  onClose: () => void;
  onSave: (point: FocalPoint) => void;
}

const getPointFromEvent = (event: React.PointerEvent<HTMLDivElement>, element: HTMLDivElement) => {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return {
    focal_x: clampPercent(x),
    focal_y: clampPercent(y),
  };
};

export const FocalPointEditor = ({ open, imageUrl, value, onClose, onSave }: FocalPointEditorProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<FocalPoint>({
    focal_x: DEFAULT_FOCAL_POINT.x,
    focal_y: DEFAULT_FOCAL_POINT.y,
  });

  useEffect(() => {
    if (!open) return;
    setPoint({
      focal_x: clampPercent(value?.focal_x, DEFAULT_FOCAL_POINT.x),
      focal_y: clampPercent(value?.focal_y, DEFAULT_FOCAL_POINT.y),
    });
  }, [open, value?.focal_x, value?.focal_y]);

  if (!open || !imageUrl) return null;

  const updatePoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    setPoint(getPointFromEvent(event, stageRef.current));
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-background/96 backdrop-blur-xl flex flex-col"
      data-pull-refresh-disabled="true"
    >
      <header className="flex items-center justify-between px-5 pt-[calc(var(--safe-area-top)+1rem)] pb-4">
        <button
          type="button"
          onClick={onClose}
          className="h-11 w-11 rounded-full bg-card border border-foreground/10 flex items-center justify-center"
          aria-label="Cancelar ajuste"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold text-foreground">Ajustar foto</h2>
          <p className="text-xs text-muted-foreground">Toque no ponto principal do item</p>
        </div>
        <button
          type="button"
          onClick={() => onSave(point)}
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          aria-label="Salvar ajuste"
        >
          <Check className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 px-5 pb-[calc(var(--safe-area-bottom)+1.25rem)] flex flex-col gap-4">
        <div
          ref={stageRef}
          className="relative flex-1 min-h-0 rounded-[2rem] overflow-hidden border border-foreground/10 bg-black touch-none select-none"
          onPointerDown={updatePoint}
          onPointerMove={(event) => {
            if (event.buttons === 1) updatePoint(event);
          }}
        >
          <img
            src={imageUrl}
            alt="Prévia da foto"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${point.focal_x}% ${point.focal_y}%` }}
            draggable={false}
          />
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="border border-white/28" />
            ))}
          </div>
          <div
            className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-black/30 shadow-[0_0_24px_hsl(var(--primary)/0.5)] backdrop-blur-md grid place-items-center pointer-events-none"
            style={{ left: `${point.focal_x}%`, top: `${point.focal_y}%` }}
          >
            <Move className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Esse ponto será usado para centralizar a imagem no card Explorar.
        </p>
      </div>
    </div>
  );
};

