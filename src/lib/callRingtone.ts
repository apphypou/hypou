type RingtoneStop = () => void;

/**
 * Keeps the incoming-call sound self-contained. The previous implementation
 * referenced a public asset that was never shipped with the mobile bundle.
 */
export function startCallRingtone(): RingtoneStop {
  const AudioContextConstructor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextConstructor) return () => undefined;

  const context = new AudioContextConstructor();
  let stopped = false;
  let timeoutId: number | undefined;

  const ring = () => {
    if (stopped) return;

    const start = context.currentTime;
    [0, 0.16].forEach((offset) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.08, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.13);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.14);
    });

    timeoutId = window.setTimeout(ring, 1800);
  };

  void context.resume().then(ring).catch(() => {
    // iOS can require a user gesture before web audio is allowed. Native push
    // still carries APNs' default sound while the app is backgrounded.
  });

  return () => {
    stopped = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    void context.close();
  };
}
