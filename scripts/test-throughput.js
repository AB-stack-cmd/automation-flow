import http from 'node:http';

async function measureThroughput(durationMs = 2000, concurrency = 20) {
  console.log(`🚀 Starting Real-time RPS Benchmark Test...`);
  console.log(`Concurrency: ${concurrency} parallel workers, Duration: ${durationMs}ms`);

  let completedRequests = 0;
  let errorRequests = 0;
  const startTime = Date.now();
  const endTime = startTime + durationMs;

  function sendRequest() {
    return new Promise((resolve) => {
      if (Date.now() >= endTime) {
        return resolve();
      }

      const req = http.get('http://localhost:4000/health', (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          if (res.statusCode === 200) {
            completedRequests++;
          } else {
            errorRequests++;
          }
          resolve();
        });
      });

      req.on('error', () => {
        errorRequests++;
        resolve();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        errorRequests++;
        resolve();
      });
    });
  }

  async function worker() {
    while (Date.now() < endTime) {
      await sendRequest();
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const actualDurationMs = Date.now() - startTime;
  const rps = Math.round((completedRequests / actualDurationMs) * 1000);

  console.log(`----------------------------------------`);
  console.log(`✅ Benchmark Completed in ${actualDurationMs}ms`);
  console.log(`📊 Total Successful Requests: ${completedRequests}`);
  console.log(`❌ Failed Requests: ${errorRequests}`);
  console.log(`⚡ Measured Real-time RPS: ${rps.toLocaleString()} rps`);
  console.log(`----------------------------------------`);

  return { rps, completedRequests, durationMs: actualDurationMs };
}

measureThroughput().catch(console.error);
