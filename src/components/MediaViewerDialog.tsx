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

const MediaViewerDialog = ({ media, onOpenChange }: MediaViewerDialogProps) => {
  const open = !!media;
  const type = media?.type || (media?.url && isVideoUrl(media.url) ? "video" : "image");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 left-0 top-0 z-50 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-black p-0 shadow-none [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Visualização de mídia</DialogTitle>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-[calc(var(--safe-area-top)+1rem)] z-20 h-10 w-10 rounded-full bg-white/12 text-white backdrop-blur-xl border border-white/15 flex items-center justify-center"
          aria-label="Fechar mídia"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full w-full items-center justify-center px-0">
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
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewerDialog;
