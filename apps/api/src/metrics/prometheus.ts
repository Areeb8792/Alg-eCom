interface MetricCounters {
  requestsTotal: Map<string, number>;
  requestDurationSum: number;
  requestDurationCount: number;
  ordersCreatedTotal: number;
  ordersReplayedTotal: number;
  stockAdjustmentsTotal: number;
}

const metricsState: MetricCounters = {
  requestsTotal: new Map(),
  requestDurationSum: 0,
  requestDurationCount: 0,
  ordersCreatedTotal: 0,
  ordersReplayedTotal: 0,
  stockAdjustmentsTotal: 0
};

export function recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
  // Normalize path to prevent high cardinality (e.g. /api/v1/products/UUID -> /api/v1/products/:id)
  const normalizedPath = path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/HW-\d{4}-[A-Z0-9]+/gi, ':reference');

  const key = `method="${method}",path="${normalizedPath}",status="${statusCode}"`;
  const current = metricsState.requestsTotal.get(key) || 0;
  metricsState.requestsTotal.set(key, current + 1);

  metricsState.requestDurationSum += durationMs / 1000;
  metricsState.requestDurationCount += 1;
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

export function generatePrometheusMetrics(databaseUp: boolean): string {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  const lines: string[] = [
    '# HELP process_uptime_seconds Total application process uptime in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptime}`,
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

  lines.push('');
  lines.push('# HELP http_request_duration_seconds_sum Total duration of HTTP requests in seconds');
  lines.push('# TYPE http_request_duration_seconds_sum counter');
  lines.push(`http_request_duration_seconds_sum ${metricsState.requestDurationSum.toFixed(4)}`);
  lines.push('# HELP http_request_duration_seconds_count Total count of timed HTTP requests');
  lines.push('# TYPE http_request_duration_seconds_count counter');
  lines.push(`http_request_duration_seconds_count ${metricsState.requestDurationCount}`);

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
