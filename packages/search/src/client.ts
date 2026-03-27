import { Client } from '@opensearch-project/opensearch';

export type SearchClient = Client;

export function createSearchClient(url?: string): Client {
  const node = url ?? process.env['OPENSEARCH_URL'] ?? 'http://localhost:9200';

  return new Client({ node });
}
