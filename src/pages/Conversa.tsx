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
import { createReport, blockUser } from "@/services/reportService";
import { startCall } from "@/services/callService";
import { ChatHeader } from "./Conversa/ChatHeader";
import { MessageList } from "./Conversa/MessageList";
import { MessageInput } from "./Conversa/MessageInput";
import { ReportDialogs } from "./Conversa/ReportDialogs";
import RatingDialog from "@/components/RatingDialog";

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
          item_a:item_a_id (id, name, item_images (image_url, position)),
          item_b:item_b_id (id, name, item_images (image_url, position))
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
        is_user_b: !isUserA,
      };
    },
    enabled: !!conversationId && !!user,
  });
};

const Conversa = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: messages = [], isLoading } = useMessages(conversationId || null);
  const { data: details } = useConversationDetails(conversationId || null);
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
  const cancelRecordingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [callingKind, setCallingKind] = useState<"video" | "audio" | null>(null);
  const [rateOpen, setRateOpen] = useState(false);

  const handleStartCall = useCallback(async (kind: "video" | "audio") => {
    if (!conversationId || callingKind) return;
    setCallingKind(kind);
    try {
      const tk = await startCall(conversationId, kind);
      navigate(`/chamada/${tk.room_name}`, {
        state: {
          token: tk.token,
          url: tk.url,
          callSessionId: tk.call_session_id,
          kind: tk.kind,
          conversationId: tk.conversation_id,
          isCaller: true,
        },
      });
    } catch (e: any) {
      toast({ title: "Não foi possível iniciar a chamada", description: e?.message ?? "Tente novamente", variant: "destructive" });
    } finally {
      setCallingKind(null);
    }
  }, [conversationId, callingKind, navigate]);

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

  const handleFileSelect = useCallback(async (file: File, type: MessageType) => {
    setShowAttachMenu(false);
    setUploading(true);
    try {
      const mediaUrl = await uploadMedia({ file, type });
      const label = type === "image" ? "📷 Imagem" : type === "video" ? "🎬 Vídeo" : "🎤 Áudio";
      send({ content: label, messageType: type, mediaUrl });
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar mídia.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [uploadMedia, send]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // iOS/Safari não reproduz WebM de forma confiável — preferir M4A/MP4 nele.
      const isAppleBrowser = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
      const candidates = isAppleBrowser
        ? ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"]
        : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          audioChunksRef.current = [];
          return;
        }
        const actualType = (recorder.mimeType || mimeType || "audio/webm").split(";")[0];
        const ext = actualType.includes("mp4") || actualType.includes("aac") || actualType.includes("m4a") ? "m4a" : actualType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(audioChunksRef.current, { type: actualType });
        if (!blob.size) {
          toast({ title: "Erro", description: "Áudio vazio. Tente gravar novamente.", variant: "destructive" });
          return;
        }
        // Áudios muito curtos (< 500ms) geralmente são toques acidentais
        if (blob.size < 1500) {
          toast({ title: "Segure para gravar", description: "Mantenha o botão pressionado para gravar áudio." });
          return;
        }
        const file = new File([blob], `audio_${Date.now()}.${ext}`, { type: actualType });
        await handleFileSelect(file, "audio");
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setShowAttachMenu(false);
    } catch (err: any) {
      let description = "Não foi possível acessar o microfone.";
      if (err?.name === "NotAllowedError") description = "Permissão negada. Libere o microfone nas configurações.";
      else if (err?.name === "NotFoundError") description = "Nenhum microfone encontrado.";
      else if (err?.name === "NotReadableError") description = "Microfone em uso por outro app.";
      toast({ title: "Erro", description, variant: "destructive" });
    }
  }, [handleFileSelect]);

  const stopRecording = useCallback((cancel = false) => {
    cancelRecordingRef.current = cancel;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

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
  };

  const chatLocked = details?.match_status === "completed" || details?.match_status === "cancelled";

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-display overflow-hidden">
      {user && (
        <ChatSafetyDialog
          open={showSafetyDialog}
          userId={user.id}
          onAccepted={() => queryClient.setQueryData(["chat-terms", user.id], true)}
        />
      )}

      <ChatHeader
        details={details}
        callingKind={callingKind}
        onStartCall={handleStartCall}
        onOpenReport={() => setReportOpen(true)}
        onOpenBlock={() => setBlockConfirmOpen(true)}
        onOpenRate={() => setRateOpen(true)}
      />

      {details && user && (
        <RatingDialog
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          matchId={details.match_id}
          raterId={user.id}
          ratedId={details.other_user_id}
          ratedName={details.other_user.display_name || "Usuário"}
        />
      )}

      {details && (
        <TradeContextCard
          myItem={details.my_item}
          otherItem={details.other_item}
          matchStatus={details.match_status}
        />
      )}

      <MessageList
        ref={scrollRef}
        messages={messages}
        isLoading={isLoading}
        currentUserId={user?.id}
      />

      {chatLocked && (
        <div className="shrink-0 px-4 py-5 border-t border-foreground/5 bg-card/50 backdrop-blur-xl text-center">
          <p className="text-sm font-semibold text-foreground/80">
            {details?.match_status === "completed" ? "Troca concluída ✅" : "Conversa encerrada 🔒"}
          </p>
          <p className="text-xs text-foreground/50 mt-1">
            {details?.match_status === "completed"
              ? "Esta conversa foi finalizada. Avalie seu trocador na tela de Trocas."
              : "Este item não está mais disponível."}
          </p>
        </div>
      )}

      {!chatLocked && chatTermsAccepted !== false && (
        <MessageInput
          text={text}
          setText={setText}
          onSend={handleSend}
          sending={sending}
          uploading={uploading}
          isRecording={isRecording}
          showAttachMenu={showAttachMenu}
          setShowAttachMenu={setShowAttachMenu}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onFileSelect={handleFileSelect}
        />
      )}

      <ReportDialogs
        reportOpen={reportOpen}
        setReportOpen={setReportOpen}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDesc={reportDesc}
        setReportDesc={setReportDesc}
        reporting={reporting}
        onReport={handleReport}
        blockConfirmOpen={blockConfirmOpen}
        setBlockConfirmOpen={setBlockConfirmOpen}
        blocking={blocking}
        onBlock={handleBlock}
      />
    </div>
  );
};

export default Conversa;
