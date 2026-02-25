import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonItemCard = () => (
  <div className="rounded-2xl bg-card/30 border border-foreground/5 p-3 flex gap-4 animate-pulse">
    <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
    <div className="flex-1 flex flex-col justify-center gap-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);

export const SkeletonMatchCard = () => (
  <div className="rounded-2xl bg-card/30 border border-foreground/5 overflow-hidden animate-pulse">
    <Skeleton className="h-48 w-full" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="flex items-center gap-2 pt-4 border-t border-foreground/5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);

export const SkeletonConversation = () => (
  <div className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card/30 border border-foreground/5 animate-pulse">
    <Skeleton className="h-14 w-14 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  </div>
);

export const SkeletonSwipeCard = () => (
  <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-card/30 border border-foreground/5 animate-pulse">
    <Skeleton className="w-full h-[60%]" />
    <div className="p-6 space-y-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-6 w-1/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

export const SkeletonProfile = () => (
  <div className="flex flex-col items-center text-center animate-pulse">
    <Skeleton className="h-24 w-24 rounded-full mb-4" />
    <Skeleton className="h-7 w-40 mb-2" />
    <Skeleton className="h-4 w-24 mb-2" />
    <Skeleton className="h-3 w-56" />
  </div>
);
