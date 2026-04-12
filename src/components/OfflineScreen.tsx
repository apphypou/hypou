import { WifiOff, RefreshCw } from "lucide-react";

const OfflineScreen = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground px-8">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold mb-2">Sem conexão</h1>
      <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs">
        Verifique sua internet e tente novamente
      </p>
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
};

export default OfflineScreen;
