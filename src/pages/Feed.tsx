import { Heart, X, Zap, Search, MessageSquare, User, SlidersHorizontal, MapPin, Flame } from "lucide-react";
import { useState } from "react";

const MOCK_ITEMS = [
  {
    id: 1,
    title: "PlayStation 5",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2glssPFSCMnhJR3UhyIkWCuFxEuSRB3fHG5PSJjWOMK1dG5F0Xh_Gl2VKf25TnHdMYuuIKqG9b2u5WIYsGkqYGfEY_pF1eqEoOGT4O0SvBrWbh3_hQXEBm_CzYVLjNcUwI_y3FIu3WZEXJiHMW7kvLKzKrYlcF1mSh3vqG1q3wnMz1v98h26K1ILlJ9Q0VTUw0bJvwJZFmHcHR7_9blr1pJsqadfuHcPHqGjJz7U7FxB3O9iiTnO2B-N_lTqg8RR1TJwjhqDRw",
    price: "R$ 3.500",
    badge: "NOVO",
    distance: "5km de você",
    description: "Console em perfeito estado, com 2 controles e 3 jogos. Aceito trocas por MacBook ou iPad...",
  },
  {
    id: 2,
    title: "MacBook Pro M2",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvz6YSWz4_L3dWfJwvh8vT8u3k8ZPJkkRp0a0j_TFwL6TfKlPzXf_r8nW5kFhvmXu3z4GRlFR7mME7d35KPsEfELiH3rPQ0WMEHxHG0IXeZ-RVlaBxQ3x5YEqH0g5ufTQJ9F5jXq4K7TUZdW3wIIlCVkXbCH27LSzIQi8hF4z5uGjqvH3Y3Pd",
    price: "R$ 8.000",
    badge: "SEMINOVO",
    distance: "12km de você",
    description: "MacBook Pro 14\" M2, 16GB RAM, 512GB SSD. Troco por câmera profissional ou moto...",
  },
];

const Feed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = MOCK_ITEMS[currentIndex % MOCK_ITEMS.length];

  const handleAction = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="h-11 w-11 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-foreground">Like</span>
          <span className="text-primary">fy</span>
        </h1>
        <button className="h-11 w-11 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-5 py-4">
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden glass-panel border border-border">
          {/* Product Image */}
          <div className="relative h-[420px] w-full overflow-hidden">
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>

          {/* Product Info */}
          <div className="relative px-5 pb-5 -mt-4">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-wider uppercase mt-1">
                {item.badge}
              </span>
            </div>
            <p className="text-primary font-bold text-base mb-2">
              Vale uns {item.price}
            </p>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground text-sm">A {item.distance}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 pb-6">
        <button
          onClick={handleAction}
          className="h-14 w-14 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-destructive/20 hover:border-destructive/40 transition-all active:scale-90"
        >
          <X className="h-6 w-6 text-muted-foreground" />
        </button>
        <button
          onClick={handleAction}
          className="h-[72px] w-[72px] rounded-full bg-primary flex items-center justify-center neon-glow hover:scale-105 transition-all active:scale-90"
        >
          <Heart className="h-8 w-8 text-primary-foreground" />
        </button>
        <button
          onClick={handleAction}
          className="h-14 w-14 rounded-full bg-secondary border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90"
        >
          <Zap className="h-6 w-6 text-primary" />
        </button>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="glass-panel border-t border-border px-8 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Flame className="h-5 w-5" />
            <span className="w-1 h-1 rounded-full bg-primary" />
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Feed;
