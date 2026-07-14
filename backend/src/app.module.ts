import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SQLITE_CONNECTION, POSTGRES_CONNECTION } from './config/database.constants';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';
import { ChatModule } from './modules/chat/chat.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { PlannerModule } from './modules/planner/planner.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { EventsModule } from './modules/events/events.module';
import { HoneymoonModule } from './modules/honeymoon/honeymoon.module';
import { FinanceModule } from './modules/finance/finance.module';
import { RepresentativeProfilesModule } from './modules/representative-profiles/representative-profiles.module';
import { VendorProfilesModule } from './modules/vendor-profiles/vendor-profiles.module';
import { MailModule } from './common/mail/mail.module';
import { VendorAuthModule } from './modules/vendor-auth/vendor-auth.module';
import { VendorDashboardModule } from './modules/vendor-dashboard/vendor-dashboard.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    MailModule,

    TypeOrmModule.forRootAsync({
      name: SQLITE_CONNECTION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get<string>(
          'SQLITE_DATABASE',
          './data/wow_dev.db',
        ),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: POSTGRES_CONNECTION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5432),
        username: configService.get<string>('POSTGRES_USER', 'wow_user'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'wow_password'),
        database: configService.get<string>('POSTGRES_DB', 'wow_db'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/wow'),
      }),
    }),

    AuthModule,
    VendorAuthModule,
    VendorDashboardModule,
    UsersModule,
    MatchmakingModule,
    ChatModule,
    VendorsModule,
    PlannerModule,
    NotificationsModule,
    BookingsModule,
    EventsModule,
    HoneymoonModule,
    FinanceModule,
    RepresentativeProfilesModule,
    VendorProfilesModule,
    VendorAuthModule,
    VendorDashboardModule,
    AgentModule,
  ],
})
export class AppModule {}