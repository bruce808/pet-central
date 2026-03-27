import Redis from 'ioredis';

let connection: Redis | null = null;

export function getConnection(): Redis {
  if (!connection) {
    const url = process.env['REDIS_URL'];
    if (!url) {
      throw new Error('REDIS_URL environment variable is required');
    }
    connection = new Redis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}
