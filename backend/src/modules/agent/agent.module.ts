import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicProfileController } from './customers/public-profile.controller';
import {
  POSTGRES_CONNECTION,
  SQLITE_CONNECTION,
} from '../../config/database.constants';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationDeliveryLogEntity } from '../notifications/entities/notification-delivery-log.entity';
import { Match } from '../matchmaking/entities/match.entity';
import { Neo4jModule } from '../../neo4j/neo4j.module';

import { AgentProfileEntity } from './common/entities/agent-profile.entity';
import { AgentCustomerEntity } from './common/entities/agent-customer.entity';
import { AgentCustomerMatchEntity } from './common/entities/agent-customer-match.entity';
import { AgentNoteEntity } from './common/entities/agent-note.entity';
import { AgentDocumentEntity } from './common/entities/agent-document.entity';
import { AgentWorksheetEntity } from './common/entities/agent-worksheet.entity';
import { AgentActivityEntity } from './common/entities/agent-activity.entity';

import { AgentAuthController } from './auth/agent-auth.controller';
import { AgentAuthService } from './auth/agent-auth.service';
import { AgentDashboardController } from './dashboard/dashboard.controller';
import { AgentDashboardService } from './dashboard/dashboard.service';
import { AgentCustomersController } from './customers/customers.controller';
import { AgentCustomersService } from './customers/customers.service';
import { AgentNotesController } from './notes/notes.controller';
import { AgentNotesService } from './notes/notes.service';
import { AgentDocumentsController } from './documents/documents.controller';
import { AgentDocumentsService } from './documents/documents.service';
import { AgentWorksheetController } from './worksheet/worksheet.controller';
import { AgentWorksheetService } from './worksheet/worksheet.service';
import { AgentActivityController } from './activity-log/activity-log.controller';
import { AgentActivityService } from './activity-log/activity-log.service';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    NotificationsModule,
    Neo4jModule,
    TypeOrmModule.forFeature(
      [
        User,
        AgentProfileEntity,
        AgentCustomerEntity,
        AgentCustomerMatchEntity,
        AgentNoteEntity,
        AgentDocumentEntity,
        AgentWorksheetEntity,
        AgentActivityEntity,
        NotificationDeliveryLogEntity,
      ],
      POSTGRES_CONNECTION,
    ),
    TypeOrmModule.forFeature([Match], SQLITE_CONNECTION),
  ],
  controllers: [
    AgentAuthController,
    AgentDashboardController,
    AgentCustomersController,
    PublicProfileController,
    AgentNotesController,
    AgentDocumentsController,
    AgentWorksheetController,
    AgentActivityController,
  ],
  providers: [
    AgentAuthService,
    AgentDashboardService,
    AgentCustomersService,
    AgentNotesService,
    AgentDocumentsService,
    AgentWorksheetService,
    AgentActivityService,
  ],
  exports: [AgentCustomersService, AgentActivityService],
})
export class AgentModule {}
