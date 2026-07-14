import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSTGRES_CONNECTION } from '../../config/database.constants';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';

import { AgentProfileEntity } from './common/entities/agent-profile.entity';
import { AgentCustomerEntity } from './common/entities/agent-customer.entity';
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
    TypeOrmModule.forFeature(
      [
        User,
        AgentProfileEntity,
        AgentCustomerEntity,
        AgentNoteEntity,
        AgentDocumentEntity,
        AgentWorksheetEntity,
        AgentActivityEntity,
      ],
      POSTGRES_CONNECTION,
    ),
  ],
  controllers: [
    AgentAuthController,
    AgentDashboardController,
    AgentCustomersController,
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
