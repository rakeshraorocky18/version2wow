import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { neo4jDriverProvider } from './neo4j.provider';
import { Neo4jRepository } from './neo4j.repository';
import { Neo4jService } from './neo4j.service';

/**
 * Reusable Neo4j graph module.
 * Provides a singleton Driver via DI and exports Neo4jService for matchmaking.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [neo4jDriverProvider, Neo4jRepository, Neo4jService],
  exports: [Neo4jService, Neo4jRepository],
})
export class Neo4jModule {}
