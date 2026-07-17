export type OnboardingProfile = {
  onboarding_completed: boolean;
} | null;

type OnboardingRouteState = {
  profile: OnboardingProfile | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

export const getOnboardingRouteState = ({
  profile,
  isLoading,
  isFetching,
  isError,
}: OnboardingRouteState): "loading" | "onboarding" | "ready" => {
  // Only block the route on the first lookup. Native photo/video pickers
  // background the app briefly; refetching on return must not unmount the
  // current form and discard the selected media.
  if (profile === undefined && (isLoading || isFetching)) return "loading";
  if (isFetching) return "ready";
  if (isError) return "ready";
  return profile?.onboarding_completed ? "ready" : "onboarding";
};
