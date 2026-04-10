/**
 * In-memory pub/sub event bus for SSE real-time messaging.
 * Stored on globalThis to survive Next.js HMR in development.
 */

export interface SSEEvent {
  type: 'message.new' | 'session.new' | 'session.updated';
  data: Record<string, unknown>;
}

type Subscriber = (event: SSEEvent) => void;

class EventBus {
  private subscribers = new Map<string, Subscriber>();

  subscribe(id: string, callback: Subscriber): void {
    this.subscribers.set(id, callback);
  }

  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  publish(event: SSEEvent): void {
    for (const [id, callback] of this.subscribers) {
      try {
        callback(event);
      } catch {
        // Remove broken subscribers silently
        this.subscribers.delete(id);
      }
    }
  }

  get size(): number {
    return this.subscribers.size;
  }
}

// Singleton — survives HMR in dev
const g = globalThis as unknown as { __eventBus?: EventBus };
if (!g.__eventBus) g.__eventBus = new EventBus();
export const eventBus: EventBus = g.__eventBus;
