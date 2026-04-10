import { ArrowLeft, Send, Check, CheckCheck, Loader2, Plus, Image, Video, Mic, X, MicOff, Flag, CheckCircle2, XCircle, MoreVertical, Ban } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages, useSendMessage, useUploadChatMedia } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ChatSafetyDialog from "@/components/ChatSafetyDialog";
import TradeContextCard from "@/components/TradeContextCard";
import type { MessageType } from "@/services/messageService";
import { toast } from "@/hooks/use-toast";
import { acceptProposal, rejectProposal } from "@/services/matchService";
import { createReport, blockUser } from "@/services/reportService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

// Fetch conversation details including match status
const useConversationDetails = (conversationId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      if (!conversationId || !user) return null;

      const { data: conv } = await supabase
        .from("conversations")
        .select("id, match_id")
        .eq("id", conversationId)
        .single();

      if (!conv) return null;

      const { data: match } = await supabase
        .from("matches")
        .select(`
          id, status, user_a_id, user_b_id,
          item_a:item_a_id (name, item_images (image_url, position)),
          item_b:item_b_id (name, item_images (image_url, position))
        `)
        .eq("id", conv.match_id)
        .single();

      if (!match) return null;

      const isUserA = match.user_a_id === user.id;
      const otherUserId = isUserA ? match.user_b_id : match.user_a_id;
      const otherItem = isUserA ? match.item_b : match.item_a;
      const myItem = isUserA ? match.item_a : match.item_b;

      const { data: profile } = await supabase
        .from("public_profiles" as any)
        .select("display_name, avatar_url")
        .eq("user_id", otherUserId)
        .single();

      return {
        match_id: match.id,
        match_status: match.status,
        other_user_id: otherUserId,
        other_user: (profile as any) || { display_name: "Usuário", avatar_url: null },
        other_item: otherItem as any,
        my_item: myItem as any,
        is_user_b: !isUserA, // user_b is the one who receives proposals
      };
    },
    enabled: !!conversationId && !!user,
  });
};

const Conversa = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: messages = [], isLoading } = useMessages(conversationId || null);
  const { data: details, refetch: refetchDetails } = useConversationDetails(conversationId || null);
  const { mutate: send, isPending: sending } = useSendMessage(conversationId || null);
  const { mutateAsync: uploadMedia } = useUploadChatMedia();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  // Block dialog
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // Check if user accepted chat terms
  const { data: chatTermsAccepted } = useQuery({
    queryKey: ["chat-terms", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("chat_terms_accepted_at")
        .eq("user_id", user!.id)
        .single();
      return !!(data as any)?.chat_terms_accepted_at;
    },
    enabled: !!user,
  });

  const showSafetyDialog = chatTermsAccepted === false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    send({ content: trimmed });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = useCallback(async (file: File, type: MessageType) => {
    setShowAttachMenu(false);
    setUploading(true);
    try {
      const mediaUrl = await uploadMedia({ file, type });
      const label = type === 'image' ? '📷 Imagem' : type === 'video' ? '🎬 Vídeo' : '🎤 Áudio';
      send({ content: label, messageType: type, mediaUrl });
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar mídia.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [uploadMedia, send]);

  const handleImagePick = () => fileInputRef.current?.click();
  const handleVideoPick = () => videoInputRef.current?.click();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
        await handleFileSelect(file, "audio");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setShowAttachMenu(false);
    } catch {
      toast({ title: "Erro", description: "Não foi possível acessar o microfone.", variant: "destructive" });
    }
  }, [handleFileSelect]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const handleAcceptTrade = async () => {
    if (!details?.match_id) return;
    setActionLoading(true);
    try {
      await acceptProposal(details.match_id, user!.id);
      toast({ title: "Troca aceita! ✅", description: "Combinem a entrega pelo chat." });
      refetchDetails();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTrade = async () => {
    if (!details?.match_id) return;
    setActionLoading(true);
    try {
      await rejectProposal(details.match_id, user!.id);
      toast({ title: "Proposta recusada" });
      refetchDetails();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user || !details?.other_user_id || !reportReason) return;
    setReporting(true);
    try {
      await createReport(user.id, details.other_user_id, reportReason, reportDesc || undefined);
      toast({ title: "Denúncia enviada", description: "Vamos analisar o caso." });
      setReportOpen(false);
      setReportReason("");
      setReportDesc("");
    } catch {
      toast({ title: "Erro ao enviar denúncia", variant: "destructive" });
    } finally {
      setReporting(false);
    }
  };

  const handleBlock = async () => {
    if (!user || !details?.other_user_id) return;
    setBlocking(true);
    try {
      await blockUser(user.id, details.other_user_id);
      toast({ title: "Usuário bloqueado 🚫", description: "Você não verá mais itens deste usuário." });
      setBlockConfirmOpen(false);
      navigate("/chat");
    } catch {
      toast({ title: "Erro ao bloquear", variant: "destructive" });
    } finally {
      setBlocking(false);
    }
  

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageContent = (msg: any) => {
    const type = msg.message_type || 'text';
    const mediaUrl = msg.media_url;

    if (type === 'image' && mediaUrl) {
      return (
        <img
          src={mediaUrl}
          alt="Imagem"
          className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      );
    }

    if (type === 'video' && mediaUrl) {
      return (
        <video
          src={mediaUrl}
          controls
          className="rounded-xl max-w-full max-h-60"
          preload="metadata"
        />
      );
    }

    if (type === 'audio' && mediaUrl) {
      return (
        <audio
          src={mediaUrl}
          controls
          className="max-w-full min-w-[180px] [&::-webkit-media-controls-panel]:bg-transparent [&::-webkit-media-controls-panel]:shadow-none"
          preload="metadata"
          style={{ height: '36px' }}
        />
      );
    }

    return <p className="text-sm leading-relaxed break-words">{msg.content}</p>;
  };

  const matchStatusLabel = details?.match_status === "accepted"
    ? "Troca aceita ✅"
    : details?.match_status === "rejected"
    ? "Proposta recusada ❌"
    : details?.match_status === "proposal"
    ? "Proposta pendente ⏳"
    : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-display overflow-hidden">
      {/* Safety Dialog */}
      {user && (
        <ChatSafetyDialog
          open={showSafetyDialog}
          userId={user.id}
          onAccepted={() => queryClient.setQueryData(["chat-terms", user.id], true)}
        />
      )}

      {/* Header */}
      <header className="relative z-40 flex items-center gap-3 px-4 pt-4 pb-3 border-b border-foreground/5 bg-background/80 backdrop-blur-xl shrink-0">
        <button
          onClick={() => navigate("/chat")}
          className="h-10 w-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {details && (
          <button
            onClick={() => navigate(`/usuario/${details.other_user_id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            {details.other_user.avatar_url ? (
              <img
                src={details.other_user.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-foreground/10"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-card border border-foreground/10 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground/30">
                  {(details.other_user.display_name || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground truncate">
                {details.other_user.display_name || "Usuário"}
              </p>
              <p className="text-[10px] text-foreground/40 truncate">
                {details.my_item?.name} ↔ {details.other_item?.name}
              </p>
            </div>
          </button>
        )}

        {/* Report button */}
        {details && (
          <button
            onClick={() => setReportOpen(true)}
            className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/30 hover:text-destructive transition-colors"
          >
            <Flag className="h-4 w-4" />
          </button>
        )}
      </header>

      {/* Trade context card */}
      {details && (
        <TradeContextCard
          myItem={details.my_item}
          otherItem={details.other_item}
          matchStatus={details.match_status}
        />
      )}

      {/* Accept/Reject only happens in Matches.tsx — conversations are created after acceptance */}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🤝</span>
            <p className="text-muted-foreground text-sm">
              Vocês deram match! Comece a negociar.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-foreground/5 text-foreground rounded-bl-md"
                  }`}
                >
                  {renderMessageContent(msg)}
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-foreground/30"}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isMine && (
                      msg.read_at ? (
                        <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                      ) : (
                        <Check className="h-3 w-3 text-primary-foreground/40" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "video");
          e.target.value = "";
        }}
      />

      {/* Input area */}
      {chatTermsAccepted !== false && (
        <div className="shrink-0 px-4 pb-8 pt-3 border-t border-foreground/5 bg-background/80 backdrop-blur-xl">
          {/* Attachment menu */}
          {showAttachMenu && (
            <div className="flex items-center gap-2 mb-3 animate-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={handleImagePick}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-card border border-foreground/10 hover:border-primary/50 transition-all"
              >
                <Image className="h-5 w-5 text-primary" />
                <span className="text-[10px] text-foreground/60 font-medium">Imagem</span>
              </button>
              <button
                onClick={handleVideoPick}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-card border border-foreground/10 hover:border-primary/50 transition-all"
              >
                <Video className="h-5 w-5 text-primary" />
                <span className="text-[10px] text-foreground/60 font-medium">Vídeo</span>
              </button>
              <button
                onClick={startRecording}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-card border border-foreground/10 hover:border-primary/50 transition-all"
              >
                <Mic className="h-5 w-5 text-primary" />
                <span className="text-[10px] text-foreground/60 font-medium">Áudio</span>
              </button>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-3 mb-3 px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm text-destructive font-medium flex-1">Gravando áudio...</span>
              <button
                onClick={stopRecording}
                className="h-9 w-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <MicOff className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Upload indicator */}
          {uploading && (
            <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-xs text-primary font-medium">Enviando mídia...</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={isRecording || uploading}
              className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${
                showAttachMenu
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-foreground/10 text-foreground/50 hover:text-foreground"
              } disabled:opacity-30`}
            >
              {showAttachMenu ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={isRecording || uploading}
                className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-2xl px-4 py-3 pr-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20 resize-none text-sm max-h-32 disabled:opacity-50"
                style={{ minHeight: "44px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending || isRecording || uploading}
              className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100 neon-glow"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-background border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Denunciar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Motivo</p>
              <div className="flex flex-wrap gap-2">
                {["Golpe", "Conteúdo impróprio", "Assédio", "Perfil falso", "Outro"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                      reportReason === reason
                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                        : "bg-foreground/5 border border-foreground/10 text-foreground/70 hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Detalhes (opcional)</p>
              <Textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                rows={3}
                className="bg-foreground/5 border-foreground/10 resize-none focus:border-primary/50"
              />
            </div>
            <button
              onClick={handleReport}
              disabled={!reportReason || reporting}
              className="w-full py-3 rounded-full bg-destructive text-white font-bold text-sm uppercase tracking-wider disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-destructive/90 transition-all shadow-[0_4px_16px_hsl(var(--destructive)/0.3)]"
            >
              {reporting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Denúncia
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Conversa;
