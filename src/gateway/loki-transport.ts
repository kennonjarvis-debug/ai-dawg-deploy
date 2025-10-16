/**
 * Loki Transport for Winston
 * Streams logs to Grafana Loki for centralized logging
 */

import Transport from 'winston-transport';
import axios from 'axios';

interface LokiTransportOptions extends Transport.TransportStreamOptions {
  host: string;
  labels?: Record<string, string>;
  batchSize?: number;
  interval?: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  [key: string]: any;
}

export class LokiTransport extends Transport {
  private host: string;
  private labels: Record<string, string>;
  private batchSize: number;
  private interval: number;
  private batch: Array<{ ts: string; line: string }> = [];
  private timer?: NodeJS.Timeout;

  constructor(options: LokiTransportOptions) {
    super(options);

    this.host = options.host;
    this.labels = options.labels || { service: 'gateway' };
    this.batchSize = options.batchSize || 100;
    this.interval = options.interval || 5000; // 5 seconds

    // Start batch timer
    this.startTimer();
  }

  log(info: LogEntry, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Format log entry
    const timestamp = new Date().getTime() * 1000000; // nanoseconds
    const line = JSON.stringify({
      level: info.level,
      message: info.message,
      ...info,
    });

    this.batch.push({
      ts: timestamp.toString(),
      line,
    });

    // Send batch if size limit reached
    if (this.batch.length >= this.batchSize) {
      this.sendBatch();
    }

    callback();
  }

  /**
   * Send batch to Loki
   */
  private async sendBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const batch = [...this.batch];
    this.batch = [];

    try {
      const payload = {
        streams: [
          {
            stream: this.labels,
            values: batch.map((entry) => [entry.ts, entry.line]),
          },
        ],
      };

      await axios.post(`${this.host}/loki/api/v1/push`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Log error but don't throw to prevent log loop
      console.error('Failed to send logs to Loki:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Start batch timer
   */
  private startTimer(): void {
    this.timer = setInterval(() => {
      this.sendBatch();
    }, this.interval);
  }

  /**
   * Close transport and flush remaining logs
   */
  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.sendBatch();
  }
}
