// ==============================================================================
// Algions Product & Order API — Native Prometheus Metrics Engine
// Implements standard OpenMetrics / Prometheus text exposition format
// Tracks system uptime, RSS/heap memory, database connectivity, request rate,
// request duration histogram (for real p95/p99 quantiles), and domain counters.
// ==============================================================================

export const DURATION_BUCKETS: readonly number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

interface MetricCounters {
  requestsTotal: Map<string, number>;
  requestDurationSum: number;
  requestDurationCount: number;
  requestDurationBuckets: Map<number, number>;
  ordersCreatedTotal: number;
  ordersReplayedTotal: number;
  stockAdjustmentsTotal: number;
}

const metricsState: MetricCounters = {
  requestsTotal: new Map(),
  requestDurationSum: 0,
  requestDurationCount: 0,
  requestDurationBuckets: new Map(),
  ordersCreatedTotal: 0,
  ordersReplayedTotal: 0,
  stockAdjustmentsTotal: 0
};

// Initialize zero-count buckets for histogram monotonicity
for (const b of DURATION_BUCKETS) {
  metricsState.requestDurationBuckets.set(b, 0);
}

/**
 * Record an incoming HTTP request with normalized path templates to prevent
 * metric cardinality explosion, updating both the counter and latency histogram.
 */
export function recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
  // Normalize path to prevent high cardinality (e.g. /api/v1/products/UUID -> /api/v1/products/:id)
  const normalizedPath = path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/HW-\d{4}-[A-Z0-9]+/gi, ':reference')
    .replace(/\?.*$/, '');

  const key = `method="${method}",path="${normalizedPath}",status="${statusCode}"`;
  const current = metricsState.requestsTotal.get(key) || 0;
  metricsState.requestsTotal.set(key, current + 1);

  const durationSec = durationMs / 1000;
  metricsState.requestDurationSum += durationSec;
  metricsState.requestDurationCount += 1;

  // Update cumulative histogram buckets
  for (const b of DURATION_BUCKETS) {
    if (durationSec <= b) {
      const cur = metricsState.requestDurationBuckets.get(b) || 0;
      metricsState.requestDurationBuckets.set(b, cur + 1);
    }
  }
}

export function recordOrderCreated(): void {
  metricsState.ordersCreatedTotal += 1;
}

export function recordOrderReplayed(): void {
  metricsState.ordersReplayedTotal += 1;
}

export function recordStockAdjustment(): void {
  metricsState.stockAdjustmentsTotal += 1;
}

/**
 * Generate Prometheus text format metrics according to Prometheus 2.x+ / OpenMetrics spec.
 * Content-Type should be: text/plain; version=0.0.4; charset=utf-8
 */
export function generatePrometheusMetrics(databaseUp: boolean): string {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  const lines: string[] = [
    '# HELP process_uptime_seconds Total application process uptime in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime.toFixed(3)}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${memory.rss}`,
    '',
    '# HELP process_heap_used_bytes Process heap memory currently used in bytes',
    '# TYPE process_heap_used_bytes gauge',
    `process_heap_used_bytes ${memory.heapUsed}`,
    '',
    '# HELP database_up Database connection health status (1 for connected, 0 for disconnected)',
    '# TYPE database_up gauge',
    `database_up ${databaseUp ? 1 : 0}`,
    '',
    '# HELP http_requests_total Total number of HTTP requests processed by method, path and status',
    '# TYPE http_requests_total counter'
  ];

  if (metricsState.requestsTotal.size === 0) {
    lines.push('http_requests_total{method="GET",path="/api/v1/health/live",status="200"} 0');
  } else {
    for (const [labels, count] of metricsState.requestsTotal.entries()) {
      lines.push(`http_requests_total{${labels}} ${count}`);
    }
  }

  // Proper Prometheus histogram for request latency
  lines.push('');
  lines.push('# HELP http_request_duration_seconds HTTP request latency distributions in seconds');
  lines.push('# TYPE http_request_duration_seconds histogram');
  for (const b of DURATION_BUCKETS) {
    const count = metricsState.requestDurationBuckets.get(b) || 0;
    lines.push(`http_request_duration_seconds_bucket{le="${b}"} ${count}`);
  }
  lines.push(`http_request_duration_seconds_bucket{le="+Inf"} ${metricsState.requestDurationCount}`);
  lines.push(`http_request_duration_seconds_sum ${metricsState.requestDurationSum.toFixed(4)}`);
  lines.push(`http_request_duration_seconds_count ${metricsState.requestDurationCount}`);

  // Domain counters
  lines.push('');
  lines.push('# HELP orders_created_total Total count of successfully placed domain orders');
  lines.push('# TYPE orders_created_total counter');
  lines.push(`orders_created_total ${metricsState.ordersCreatedTotal}`);

  lines.push('');
  lines.push('# HELP orders_idempotent_replayed_total Total count of idempotent order replays intercepted');
  lines.push('# TYPE orders_idempotent_replayed_total counter');
  lines.push(`orders_idempotent_replayed_total ${metricsState.ordersReplayedTotal}`);

  lines.push('');
  lines.push('# HELP stock_adjustments_total Total count of administrative inventory adjustments committed');
  lines.push('# TYPE stock_adjustments_total counter');
  lines.push(`stock_adjustments_total ${metricsState.stockAdjustmentsTotal}`);
  lines.push('');

  return lines.join('\n');
}
