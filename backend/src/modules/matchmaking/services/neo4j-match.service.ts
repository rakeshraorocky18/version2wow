import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Graph traversal layer for match recommendations.
 * When NEO4J_URI is configured, this service can traverse interest/mutual-connection graphs.
 * Until then, returns empty and the SQL recommendation engine handles ranking.
 */
@Injectable()
export class Neo4jMatchService {
  private readonly logger = new Logger(Neo4jMatchService.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.configService.get<string>('NEO4J_URI'));
  }

  /** Profile IDs ranked by graph proximity (friends-of-friends, mutual interests). */
  async getGraphBoostProfileIds(_userId: string, _limit = 20): Promise<string[]> {
    if (!this.isEnabled()) return [];

    this.logger.debug('Neo4j configured but driver not wired yet — using SQL fallback');
    return [];
  }
}
