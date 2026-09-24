import { EventEmitter } from "node:events";

export interface FileUploadedEvent {
  fileId: string;
  mimeType: string;
  key: string;
}

interface AppEvents {
  "file.uploaded": [FileUploadedEvent];
}

class TypedEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  emit<K extends keyof AppEvents>(event: K, ...args: AppEvents[K]): void {
    this.emitter.emit(event, ...args);
  }

  on<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): void {
    this.emitter.on(event, listener);
  }
}

export const eventBus = new TypedEventBus();