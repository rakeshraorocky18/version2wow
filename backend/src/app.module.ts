import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { VendorDashboardModule } from './modules/vendor-dashboard/vendor-dashboard.module';
import { VendorAuthModule } from './modules/vendor-auth/vendor-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get('POSTGRES_HOST'),
        port: Number(configService.get('POSTGRES_PORT')),

        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),

        database: configService.get('POSTGRES_DB'),

        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
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
    VendorDashboardModule,
    VendorAuthModule,
  ],
})
export class AppModule {}
