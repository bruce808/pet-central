import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1/ai');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5000'],
    credentials: true,
  });

  const port = process.env.AI_ORCHESTRATOR_PORT || 5200;
  await app.listen(port);
  console.log(`AI Orchestrator running on port ${port}`);
}
bootstrap();
