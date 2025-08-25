import { EventEmitter } from 'events';

if (typeof global.EventEmitter === 'undefined') {
  global.EventEmitter = EventEmitter;
}

// Add Event class polyfill for React Native
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    type: string;
    target: any;
    currentTarget: any;
    eventPhase: number;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    composed: boolean;
    timeStamp: number;
    isTrusted: boolean;

    constructor(type: string, eventInitDict?: EventInit) {
      this.type = type;
      this.bubbles = eventInitDict?.bubbles || false;
      this.cancelable = eventInitDict?.cancelable || false;
      this.composed = eventInitDict?.composed || false;
      this.timeStamp = Date.now();
      this.defaultPrevented = false;
      this.eventPhase = 0;
      this.isTrusted = false;
      this.target = null;
      this.currentTarget = null;
    }

    preventDefault() {
      this.defaultPrevented = true;
    }

    stopPropagation() {
      // No-op for now
    }

    stopImmediatePropagation() {
      // No-op for now
    }
  };
}

// Add CustomEvent class polyfill
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    detail: any;

    constructor(type: string, eventInitDict?: CustomEventInit) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail || null;
    }
  };
}