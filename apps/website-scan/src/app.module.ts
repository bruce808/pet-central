import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma.module';
import { WebsitesModule } from './modules/websites/websites.module';
import { ScansModule } from './modules/scans/scans.module';
import { PagesModule } from './modules/pages/pages.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { QualityChecksModule } from './modules/quality-checks/quality-checks.module';
import { PromotionModule } from './modules/promotion/promotion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    BullModule.forRoot({
      connection: {
        host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
        port: Number(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port) || 6379,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    WebsitesModule,
    ScansModule,
    PagesModule,
    ExtractionModule,
    QualityChecksModule,
    PromotionModule,
  ],
})
export class AppModule {}
