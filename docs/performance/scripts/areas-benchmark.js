const { performance } = require('node:perf_hooks');

const base = 'http://127.0.0.1:3100/work-areas/availability';
const scenarios = [
  {
    name: 'occupied',
    query: 'date=2026-08-01&startTime=08%3A30&endTime=09%3A30',
  },
  {
    name: 'available',
    query: 'date=2026-08-01&startTime=13%3A00&endTime=14%3A00',
  },
];

const percentile = (values, fraction) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(fraction * sorted.length) - 1];
};

async function measure(url, count, concurrency) {
  const times = [];
  let errors = 0;
  let payloadBytes = 0;
  let next = 0;
  const started = performance.now();

  async function worker() {
    while (next < count) {
      next += 1;
      const requestStarted = performance.now();
      try {
        const response = await fetch(url);
        const body = await response.arrayBuffer();
        times.push(performance.now() - requestStarted);
        payloadBytes = body.byteLength;
        if (!response.ok) errors += 1;
      } catch {
        times.push(performance.now() - requestStarted);
        errors += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsed = performance.now() - started;
  return {
    count,
    concurrency,
    p50_ms: Number(percentile(times, 0.5).toFixed(2)),
    p95_ms: Number(percentile(times, 0.95).toFixed(2)),
    p99_ms: Number(percentile(times, 0.99).toFixed(2)),
    mean_ms: Number(
      (times.reduce((total, value) => total + value, 0) / times.length).toFixed(2),
    ),
    throughput_rps: Number((count / (elapsed / 1000)).toFixed(2)),
    errors,
    payload_bytes: payloadBytes,
  };
}

async function main() {
  for (let repetition = 1; repetition <= 3; repetition += 1) {
    for (const scenario of scenarios) {
      const url = `${base}?${scenario.query}`;
      for (let warmup = 0; warmup < 3; warmup += 1) {
        await fetch(url).then((response) => response.arrayBuffer());
      }
      for (const [count, concurrency] of [[30, 1], [100, 10]]) {
        console.log(JSON.stringify({
          repetition,
          scenario: scenario.name,
          ...(await measure(url, count, concurrency)),
        }));
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
