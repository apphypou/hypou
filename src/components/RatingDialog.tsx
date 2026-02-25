import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitRating } from "@/hooks/useRatings";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface RatingDialogProps {
  open: boolean;
  onClose: () => void;
  matchId: string;
  raterId: string;
  ratedId: string;
  ratedName: string;
}

const RatingDialog = ({ open, onClose, matchId, raterId, ratedId, ratedName }: RatingDialogProps) => {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (score === 0) {
      toast({ title: "Selecione uma nota", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await submitRating({
        match_id: matchId,
        rater_id: raterId,
        rated_id: ratedId,
        score,
        comment: comment.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["match-rating"] });
      queryClient.invalidateQueries({ queryKey: ["user-rating"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
      toast({ title: "Avaliação enviada!" });
      onClose();
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast({ title: "Você já avaliou esta troca", variant: "destructive" });
      } else {
        toast({ title: "Erro ao avaliar", description: err.message, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-md flex items-center justify-center px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card border border-foreground/10 rounded-3xl p-6"
          >
            <h2 className="text-xl font-extrabold text-foreground text-center mb-1">
              Avaliar Troca
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Como foi sua experiência com {ratedName}?
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setScore(s)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      s <= (hovered || score)
                        ? "text-primary fill-primary"
                        : "text-foreground/15"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentário (opcional)"
              rows={2}
              maxLength={300}
              className="w-full bg-background border border-foreground/10 text-foreground rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-full border border-foreground/10 text-foreground/60 font-bold text-sm"
              >
                Pular
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || score === 0}
                className="flex-[2] h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RatingDialog;
