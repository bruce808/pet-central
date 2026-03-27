import { createModerationWorker } from './processors/moderation.processor';
import { createSearchIndexWorker } from './processors/search-index.processor';
import { createNotificationsWorker } from './processors/notifications.processor';
import { createAIEnrichmentWorker } from './processors/ai-enrichment.processor';
import { createTrustScoringWorker } from './processors/trust-scoring.processor';
import { getConnection } from './connection';

async function main() {
  const connection = getConnection();

  const workers = [
    createModerationWorker(connection),
    createSearchIndexWorker(connection),
    createNotificationsWorker(connection),
    createAIEnrichmentWorker(connection),
    createTrustScoringWorker(connection),
  ];

  console.log(`Worker jobs started: ${workers.length} workers registered`);

  const shutdown = async () => {
    console.log('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('Fatal error starting workers:', error);
  process.exit(1);
});
