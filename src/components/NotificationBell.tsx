import { Bell, X, Handshake, MessageSquare, Star, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

const iconMap: Record<string, typeof Bell> = {
  match: Handshake,
  message: MessageSquare,
  rating: Star,
  trade_confirmed: CheckCircle,
};

const NotificationItem = ({
  n,
  onClick,
}: {
  n: Notification;
  onClick: (n: Notification) => void;
}) => {
  const Icon = iconMap[n.type] || Bell;
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-foreground/5 active:bg-foreground/10 ${
        !n.read_at ? "bg-primary/5" : ""
      }`}
    >
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
          !n.read_at
            ? "bg-primary/15 text-primary"
            : "bg-foreground/5 text-foreground/30"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            !n.read_at ? "text-foreground" : "text-foreground/60"
          }`}
        >
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {n.body}
          </p>
        )}
        <p className="text-[10px] text-foreground/30 mt-1">
          {formatDistanceToNow(new Date(n.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      {!n.read_at && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2.5" />
      )}
    </button>
  );
};

const NotificationList = ({
  notifications,
  onItemClick,
  onMarkAll,
  hasUnread,
}: {
  notifications: Notification[];
  onItemClick: (n: Notification) => void;
  onMarkAll?: () => void;
  hasUnread?: boolean;
}) => {
  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-3">
          <Bell className="h-5 w-5 text-foreground/20" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Nenhuma notificação
        </p>
        <p className="text-xs text-foreground/30 mt-1">
          Você será notificado sobre matches e mensagens
        </p>
      </div>
    );
  }

  // Group similar pending proposals into a single summary entry
  const proposals = notifications.filter((n) => !n.read_at && n.type === "proposal");
  const others = notifications.filter((n) => !(proposals.length > 2 && !n.read_at && n.type === "proposal"));
  const grouped: Notification[] = proposals.length > 2
    ? [
        {
          ...proposals[0],
          id: `group-proposals-${proposals[0].id}`,
          title: `${proposals.length} novas propostas`,
          body: "Toque para ver todas as propostas pendentes.",
          data: { ...proposals[0].data, grouped: true, count: proposals.length },
        } as Notification,
        ...others,
      ]
    : notifications;

  return (
    <div>
      {hasUnread && onMarkAll && (
        <div className="px-4 py-2 flex justify-end border-b border-foreground/5">
          <button
            onClick={onMarkAll}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Marcar todas como lidas
          </button>
        </div>
      )}
      <div className="divide-y divide-foreground/5">
        {grouped.slice(0, 20).map((n) => (
          <NotificationItem key={n.id} n={n} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.type === "match" || n.type === "trade_confirmed") {
      navigate(`/match/${n.data.match_id}`);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    // Don't auto-mark; let user choose via "Marcar todas como lidas"
  };

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label={unreadCount > 0 ? `Notificações: ${unreadCount} não lidas` : "Notificações"}
        className="relative h-9 w-9 rounded-full flex items-center justify-center bg-card border border-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {badge}
          </span>
        )}
      </button>

      {/* Mobile: Bottom Drawer */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[85dvh]">
            <DrawerHeader className="flex flex-row items-center justify-between pb-2">
              <DrawerTitle className="text-base font-bold">
                Notificações
              </DrawerTitle>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </DrawerHeader>
            <div className="overflow-y-auto no-scrollbar flex-1 pb-safe">
              <NotificationList
                notifications={notifications}
                onItemClick={handleClick}
                onMarkAll={markAllAsRead}
                hasUnread={unreadCount > 0}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop: Floating popover */
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
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
                className="absolute right-0 top-12 z-[100] w-80 max-h-[28rem] overflow-y-auto no-scrollbar bg-card/95 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5 sticky top-0 bg-card/95 backdrop-blur-xl rounded-t-2xl z-10">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
                    Notificações
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-foreground/30 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <NotificationList
                  notifications={notifications}
                  onItemClick={handleClick}
                  onMarkAll={markAllAsRead}
                  hasUnread={unreadCount > 0}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default NotificationBell;
