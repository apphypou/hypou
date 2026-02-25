import { Bell, X, Handshake, MessageSquare, Star, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconMap: Record<string, typeof Bell> = {
  match: Handshake,
  message: MessageSquare,
  rating: Star,
  trade_confirmed: CheckCircle,
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.type === "match" || n.type === "trade_confirmed") {
      navigate(`/match/${n.data.match_id}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open && unreadCount > 0) markAllAsRead(); }}
        className="relative h-9 w-9 rounded-full flex items-center justify-center bg-card border border-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 z-[100] w-80 max-h-96 overflow-y-auto no-scrollbar bg-card border border-foreground/10 rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
                <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Notificações</span>
                <button onClick={() => setOpen(false)} className="text-foreground/30 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-foreground/10 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-foreground/5">
                  {notifications.slice(0, 20).map((n) => {
                    const Icon = iconMap[n.type] || Bell;
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/5 ${
                          !n.read_at ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.read_at ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/30"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${!n.read_at ? "text-foreground" : "text-foreground/60"}`}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                          )}
                          <p className="text-[10px] text-foreground/30 mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        {!n.read_at && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
