import { ArrowLeft, Loader2, Phone, Video, MoreVertical, Flag, Ban, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  details: {
    other_user_id: string;
    other_user: { display_name: string | null; avatar_url: string | null };
    my_item?: { name?: string };
    other_item?: { name?: string };
  } | null | undefined;
  loading?: boolean;
  callingKind: "video" | "audio" | null;
  onStartCall: (kind: "video" | "audio") => void;
  onOpenReport: () => void;
  onOpenBlock: () => void;
  onOpenRate?: () => void;
  /** H13: quando true, esconde botões de chamada (chat encerrado) */
  locked?: boolean;
}

export const ChatHeader = ({
  details,
  loading = false,
  callingKind,
  onStartCall,
  onOpenReport,
  onOpenBlock,
  onOpenRate,
  locked = false,
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const userName = details?.other_user.display_name || "Usuário";

  return (
    <header
      className="relative z-40 flex items-center gap-3 px-4 pb-3 border-b border-foreground/5 bg-background/80 backdrop-blur-xl shrink-0"
      style={{ paddingTop: "calc(var(--safe-area-top) + 0.75rem)" }}
    >
      <button
        onClick={() => navigate("/chat")}
        className="h-10 w-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {(loading || details) && (
        <button
          onClick={() => details && navigate(`/usuario/${details.other_user_id}`)}
          disabled={loading || !details}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {loading ? (
            <div className="h-10 w-10 rounded-full bg-foreground/10 animate-pulse" />
          ) : details?.other_user.avatar_url ? (
            <img
              src={details.other_user.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover border border-foreground/10"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-card border border-foreground/10 flex items-center justify-center">
              <span className="text-sm font-bold text-foreground/30">
                {userName[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <div className="h-4 w-24 rounded-full bg-foreground/10 animate-pulse" />
                <div className="mt-1.5 h-3 w-36 rounded-full bg-foreground/10 animate-pulse" />
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-foreground truncate">{userName}</p>
                <p className="text-[10px] text-foreground/40 truncate">
                  {details?.my_item?.name || "Seu item"} ↔ {details?.other_item?.name || "Item"}
                </p>
              </>
            )}
          </div>
        </button>
      )}

      {!loading && !details && (
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">Conversa</p>
          <p className="text-[10px] text-foreground/40 truncate">Não foi possível carregar os dados</p>
        </div>
      )}

      {details && (
        <div className="flex items-center gap-1">
          {!locked && (
            <>
              <button
                onClick={() => onStartCall("audio")}
                disabled={!!callingKind}
                aria-label="Chamada de áudio"
                className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-foreground/5 transition-colors disabled:opacity-40"
              >
                {callingKind === "audio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onStartCall("video")}
                disabled={!!callingKind}
                aria-label="Chamada de vídeo"
                className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-foreground/5 transition-colors disabled:opacity-40"
              >
                {callingKind === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              </button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/30 hover:text-foreground transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-foreground/10">
              {onOpenRate && (
                <DropdownMenuItem onClick={onOpenRate} className="text-foreground gap-2">
                  <Star className="h-4 w-4" />
                  Avaliar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onOpenReport} className="text-foreground gap-2">
                <Flag className="h-4 w-4" />
                Denunciar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenBlock} className="text-destructive gap-2 focus:text-destructive">
                <Ban className="h-4 w-4" />
                Bloquear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
};
