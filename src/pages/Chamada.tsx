import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  TrackRefContext,
  VideoTrack,
} from "@livekit/components-react";
import { Track, Room, RoomEvent } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, Loader2 } from "lucide-react";
import { endCall, markMissed } from "@/services/callService";
import "@livekit/components-styles";

interface CallNavState {
  token: string;
  url: string;
  callSessionId: string;
  kind: "video" | "audio";
  conversationId: string;
  isCaller: boolean;
}

export default function Chamada() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CallNavState | undefined;

  const [missedTimer, setMissedTimer] = useState<number | null>(null);
  const remoteJoinedRef = useRef(false);
  const sessionEndedRef = useRef(false);

  useEffect(() => {
    if (!state?.token) {
      navigate("/chat", { replace: true });
    }
  }, [state, navigate]);

  // Caller-side: 45s ringing timeout → mark missed
  useEffect(() => {
    if (!state?.isCaller) return;
    const t = window.setTimeout(async () => {
      if (!remoteJoinedRef.current && !sessionEndedRef.current) {
        sessionEndedRef.current = true;
        try { await markMissed(state.callSessionId); } catch {/* noop */}
        navigate(-1);
      }
    }, 45000);
    setMissedTimer(t);
    return () => clearTimeout(t);
  }, [state?.isCaller, state?.callSessionId, navigate]);

  const handleLeave = async () => {
    if (sessionEndedRef.current) {
      navigate(-1);
      return;
    }
    sessionEndedRef.current = true;
    if (missedTimer) clearTimeout(missedTimer);
    try { await endCall(state!.callSessionId); } catch {/* noop */}
    navigate(-1);
  };

  if (!state?.token) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground">
      <LiveKitRoom
        token={state.token}
        serverUrl={state.url}
        connect
        video={state.kind === "video"}
        audio
        onDisconnected={handleLeave}
        data-lk-theme="default"
        className="!h-full !w-full !bg-background"
      >
        <RoomAudioRenderer />
        <CallStage
          kind={state.kind}
          isCaller={state.isCaller}
          onLeave={handleLeave}
          onRemoteJoined={() => { remoteJoinedRef.current = true; }}
        />
      </LiveKitRoom>
    </div>
  );
}

function CallStage({
  kind,
  isCaller,
  onLeave,
  onRemoteJoined,
}: {
  kind: "video" | "audio";
  isCaller: boolean;
  onLeave: () => void;
  onRemoteJoined: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(kind === "video");
  const [callDuration, setCallDuration] = useState(0);
  const [connected, setConnected] = useState(false);

  // Track remote participants
  useEffect(() => {
    const onConnected = (_p: any) => {
      setConnected(true);
      onRemoteJoined();
    };
    const onDisconnected = () => onLeave();
    room.on(RoomEvent.ParticipantConnected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    // If a remote was already there
    if (room.numParticipants > 1) {
      setConnected(true);
      onRemoteJoined();
    }
    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, onRemoteJoined, onLeave]);

  // Duration ticker once connected
  useEffect(() => {
    if (!connected) return;
    const i = window.setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [connected]);

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };
  const toggleCam = async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
  };
  const switchCam = async () => {
    try {
      const devices = await Room.getLocalDevices("videoinput");
      if (devices.length < 2) return;
      const current = localParticipant.getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack?.getSettings().deviceId;
      const next = devices.find((d) => d.deviceId !== current) ?? devices[0];
      await room.switchActiveDevice("videoinput", next.deviceId);
    } catch {/* noop */}
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Remote video area */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <RemoteRenderer kind={kind} />
        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-foreground/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">{isCaller ? "Tocando..." : "Conectando..."}</p>
          </div>
        )}
        {connected && (
          <div className="absolute top-[max(env(safe-area-inset-top),1rem)] left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-card/60 backdrop-blur-xl border border-foreground/10 text-xs font-mono">
            {formatTime(callDuration)}
          </div>
        )}

        {/* Local self-view PiP (only for video calls) */}
        {kind === "video" && (
          <div className="absolute top-[max(env(safe-area-inset-top),1rem)] right-4 w-28 h-40 rounded-2xl overflow-hidden border border-foreground/10 shadow-2xl bg-black">
            <LocalCameraView />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 px-6 pt-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] flex items-center justify-center gap-4 bg-background/80 backdrop-blur-2xl border-t border-foreground/5">
        <ControlButton onClick={toggleMic} active={micOn} label={micOn ? "Mutar" : "Ativar microfone"}>
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </ControlButton>

        {kind === "video" && (
          <>
            <ControlButton onClick={toggleCam} active={camOn} label={camOn ? "Desligar câmera" : "Ligar câmera"}>
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton onClick={switchCam} active label="Trocar câmera">
              <SwitchCamera className="h-5 w-5" />
            </ControlButton>
          </>
        )}

        <button
          onClick={onLeave}
          aria-label="Encerrar"
          className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center active:scale-95 transition shadow-lg"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-12 w-12 rounded-full flex items-center justify-center border transition active:scale-95 ${
        active
          ? "bg-card/60 backdrop-blur-xl border-foreground/10 text-foreground"
          : "bg-foreground/10 border-foreground/5 text-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

function RemoteRenderer({ kind }: { kind: "video" | "audio" }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );
  const remoteVideo = tracks.find(
    (t) => t.source === Track.Source.Camera && !t.participant.isLocal,
  );

  if (kind === "video" && remoteVideo) {
    return (
      <TrackRefContext.Provider value={remoteVideo}>
        <VideoTrack trackRef={remoteVideo} className="!h-full !w-full object-cover" />
      </TrackRefContext.Provider>
    );
  }
  // Audio call: full-screen abstract gradient. Audio is handled by RoomAudioRenderer.
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-purple-500/20" />
  );
}

function LocalCameraView() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }], { onlySubscribed: false });
  const local = tracks.find((t) => t.participant.isLocal);
  if (!local) return <div className="h-full w-full bg-black" />;
  return (
    <TrackRefContext.Provider value={local}>
      <VideoTrack trackRef={local} className="!h-full !w-full object-cover" />
    </TrackRefContext.Provider>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
