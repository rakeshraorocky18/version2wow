import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { Match } from './entities/match.entity';
import { Shortlist } from './entities/shortlist.entity';
import { UsersModule } from '../users/users.module';
import { Neo4jMatchService } from './services/neo4j-match.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Shortlist], SQLITE_CONNECTION), UsersModule, NotificationsModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService, Neo4jMatchService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
