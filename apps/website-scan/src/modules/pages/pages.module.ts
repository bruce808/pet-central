import { Module } from '@nestjs/common';
import { PageFetcherService } from './page-fetcher.service';
import { MarkdownService } from './markdown.service';
import { PagesController, AnimalsController } from './pages.controller';

@Module({
  controllers: [PagesController, AnimalsController],
  providers: [PageFetcherService, MarkdownService],
  exports: [PageFetcherService, MarkdownService],
})
export class PagesModule {}
