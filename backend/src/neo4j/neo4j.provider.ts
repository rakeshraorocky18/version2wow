import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.constants';

const logger = new Logger('Neo4jProvider');

/**
 * Singleton Neo4j Driver provider.
 * Reads NEO4J_URI / NEO4J_USERNAME (or NEO4J_USER) / NEO4J_PASSWORD from ConfigModule.
 * Returns null when URI is missing so the app can start without Neo4j.
 */
export const neo4jDriverProvider: Provider = {
  provide: NEO4J_DRIVER,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<Driver | null> => {
    const uri = configService.get<string>('NEO4J_URI');
    if (!uri) {
      logger.warn('NEO4J_URI not set — Neo4j graph features are disabled');
      return null;
    }

    const username =
      configService.get<string>('NEO4J_USERNAME') ||
      configService.get<string>('NEO4J_USER') ||
      'neo4j';
    const password = configService.get<string>('NEO4J_PASSWORD') || '';

    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      disableLosslessIntegers: true,
    });

    try {
      await driver.verifyConnectivity();
      logger.log(`Neo4j connected at ${uri}`);
    } catch (error) {
      logger.error(
        `Neo4j connectivity check failed (${uri}). Graph features will no-op until Neo4j is reachable.`,
        error instanceof Error ? error.stack : undefined,
      );
      // Keep the driver — later calls may succeed once Neo4j comes up.
    }

    return driver;
  },
};
