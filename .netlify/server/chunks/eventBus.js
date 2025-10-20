import { l as logger } from "./logger.js";
class EventBus {
  static instance;
  listeners;
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  /**
   * Emit an event to all listeners
   * @param type - Event type
   * @param payload - Event payload data
   */
  emit(type, payload) {
    const eventData = {
      type,
      payload,
      timestamp: Date.now()
    };
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          logger.error(`Error in event handler for ${type}:`, error);
        }
      });
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(type, {
          detail: eventData
        })
      );
    }
  }
  /**
   * Subscribe to an event
   * @param type - Event type to listen for
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, /* @__PURE__ */ new Set());
    }
    const handlers = this.listeners.get(type);
    handlers.add(handler);
    return () => {
      this.off(type, handler);
    };
  }
  /**
   * Subscribe to an event that fires only once
   * @param type - Event type to listen for
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  once(type, handler) {
    const wrappedHandler = (data) => {
      handler(data);
      this.off(type, wrappedHandler);
    };
    return this.on(type, wrappedHandler);
  }
  /**
   * Unsubscribe from an event
   * @param type - Event type
   * @param handler - Handler function to remove
   */
  off(type, handler) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }
  /**
   * Remove all listeners for a specific event type
   * @param type - Event type
   */
  removeAllListeners(type) {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
  /**
   * Get count of listeners for an event type
   * @param type - Event type
   * @returns Number of listeners
   */
  listenerCount(type) {
    const handlers = this.listeners.get(type);
    return handlers ? handlers.size : 0;
  }
  /**
   * Get all event types that have listeners
   * @returns Array of event types
   */
  eventTypes() {
    return Array.from(this.listeners.keys());
  }
  /**
   * Clear all event listeners (use with caution)
   */
  clear() {
    this.listeners.clear();
  }
  /**
   * Get debug information
   */
  debug() {
    console.group("EventBus Debug Info");
    logger.info("Total event types with listeners:", this.listeners.size);
    this.listeners.forEach((handlers, type) => {
      logger.info(`  ${type}: ${handlers.size} listener(s)`);
    });
    console.groupEnd();
  }
}
const eventBus = EventBus.getInstance();
export {
  EventBus as E,
  eventBus as e
};
