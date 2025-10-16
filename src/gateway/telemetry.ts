/**
 * OpenTelemetry Configuration
 * Provides distributed tracing for the gateway service
 */

import { trace, SpanStatusCode, context } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { logger } from './logger';

// Initialize OpenTelemetry SDK
let sdk: NodeSDK | undefined;

if (process.env.OTEL_ENABLED === 'true') {
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  sdk = new NodeSDK({
    resource: new Resource({
      'service.name': 'gateway',
      'service.version': '1.0.0',
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  logger.info('OpenTelemetry SDK initialized');
}

// Get tracer instance
export const tracer = trace.getTracer('gateway', '1.0.0');

// Helper to create spans with error handling
export function withSpan<T>(
  name: string,
  fn: (span: ReturnType<typeof tracer.startSpan>) => T | Promise<T>
): Promise<T> {
  const span = tracer.startSpan(name);

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Graceful shutdown
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    logger.info('OpenTelemetry SDK shut down');
  }
}
