import { useEffect, useRef, useCallback } from "react";
import { Accelerometer } from "expo-sensors";

// Threshold for crash detection: ~4G total acceleration
const CRASH_THRESHOLD_G = 4.0;
const CRASH_THRESHOLD_MS2 = CRASH_THRESHOLD_G * 9.81; // ~39.24 m/s²

// Cooldown to prevent multiple triggers
const COOLDOWN_MS = 30000; // 30 seconds between detections

type UseCrashDetectionOptions = {
  onCrashDetected: () => void;
  enabled?: boolean;
};

/**
 * Hook that monitors the accelerometer for sudden impact events.
 * If total acceleration exceeds ~4G, triggers the callback.
 * Works 100% offline — uses native device sensors.
 * 
 * Active for ALL users (not just premium).
 */
export function useCrashDetection({ onCrashDetected, enabled = true }: UseCrashDetectionOptions) {
  const lastTriggerRef = useRef<number>(0);
  const callbackRef = useRef(onCrashDetected);

  const resetTrigger = useCallback(() => {
    lastTriggerRef.current = 0;
  }, []);

  // Keep callback ref fresh without recreating subscription
  useEffect(() => {
    callbackRef.current = onCrashDetected;
  }, [onCrashDetected]);

  const handleAccelerometerData = useCallback((data: { x: number; y: number; z: number }) => {
    // expo-sensors reports acceleration in G-force units (where 1G = gravity)
    // Total acceleration magnitude: √(x² + y² + z²)
    // At rest, this should be ~1G (just gravity)
    // During impact: spikes to 4G+ 
    const totalG = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    
    if (totalG >= CRASH_THRESHOLD_G) {
      const now = Date.now();
      if (now - lastTriggerRef.current > COOLDOWN_MS) {
        lastTriggerRef.current = now;
        console.warn(`[CrashDetection] Impact detected! ${totalG.toFixed(2)}G`);
        callbackRef.current();
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const startListening = async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
          console.warn("[CrashDetection] Accelerometer not available on this device");
          return;
        }

        // Set update interval to 100ms (10 Hz) — good balance of precision vs battery
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(handleAccelerometerData);
      } catch (e) {
        console.warn("[CrashDetection] Error starting accelerometer:", e);
      }
    };

    startListening();

    return () => {
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
      // Safety net: ensure no stray accelerometer listeners survive HMR reloads
      Accelerometer.removeAllListeners();
    };
  }, [enabled, handleAccelerometerData]);

  return { resetTrigger };
}
