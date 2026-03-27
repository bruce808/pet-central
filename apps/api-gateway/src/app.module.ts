import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ListingsModule } from './modules/listings/listings.module';
import { SearchModule } from './modules/search/search.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { TrustModule } from './modules/trust/trust.module';
import { CasesModule } from './modules/cases/cases.module';
import { ContentModule } from './modules/content/content.module';
import { AIModule } from './modules/ai/ai.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    BullModule.forRoot({
      connection: {
        host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
        port: Number(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port) || 6379,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ListingsModule,
    SearchModule,
    ReviewsModule,
    MessagingModule,
    TrustModule,
    CasesModule,
    ContentModule,
    AIModule,
    ChannelsModule,
    AdminModule,
    UploadsModule,
    ModerationModule,
  ],
})
export class AppModule {}
