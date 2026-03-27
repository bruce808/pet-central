import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { GuidanceModule } from './modules/guidance/guidance.module';
import { CorrespondenceModule } from './modules/correspondence/correspondence.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { ModerationAIModule } from './modules/moderation-ai/moderation-ai.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    PrismaModule,
    GuidanceModule,
    CorrespondenceModule,
    DiscoveryModule,
    ModerationAIModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
