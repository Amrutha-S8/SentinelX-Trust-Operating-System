import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis;

export async function connectRedis(): Promise<Redis> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  await redisClient.connect();
  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export default redisClient!;
