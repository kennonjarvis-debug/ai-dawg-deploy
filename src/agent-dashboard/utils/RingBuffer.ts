/**
 * Ring buffer for efficient scrollback storage
 * Maintains a fixed-size buffer with automatic wrapping
 */
export class RingBuffer<T> {
  private buffer: T[];
  private maxSize: number;
  private writeIndex: number = 0;
  private size: number = 0;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
  }

  push(item: T): void {
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.maxSize;
    this.size = Math.min(this.size + 1, this.maxSize);
  }

  getAll(): T[] {
    if (this.size < this.maxSize) {
      return this.buffer.slice(0, this.size);
    }
    // Buffer is full, need to reconstruct in order
    const start = this.writeIndex;
    return [
      ...this.buffer.slice(start),
      ...this.buffer.slice(0, start)
    ];
  }

  clear(): void {
    this.buffer = new Array(this.maxSize);
    this.writeIndex = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }
}
