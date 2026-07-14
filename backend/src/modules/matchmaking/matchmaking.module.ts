import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { Match } from './entities/match.entity';
import { Shortlist } from './entities/shortlist.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SQLITE_CONNECTION } from '../../config/database.constants';
import { Neo4jModule } from '../../neo4j/neo4j.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Shortlist], SQLITE_CONNECTION),
    UsersModule,
    NotificationsModule,
    Neo4jModule,
  ],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
