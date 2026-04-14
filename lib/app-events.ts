/**
 * Simple event bus for cross-screen communication within tabs.
 * Used when services.tsx needs to tell index.tsx to select a POI filter.
 */

type Listener = (data: any) => void;

const listeners = new Map<string, Set<Listener>>();

export const AppEvents = {
  emit(event: string, data?: any) {
    const subs = listeners.get(event);
    if (subs) {
      subs.forEach((fn) => fn(data));
    }
  },

  on(event: string, callback: Listener): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.get(event)?.delete(callback);
    };
  },
};

// Event names
export const EVENT_SELECT_SERVICE_FILTER = "SELECT_SERVICE_FILTER";
