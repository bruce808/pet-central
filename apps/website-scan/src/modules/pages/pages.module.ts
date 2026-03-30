import { Module } from '@nestjs/common';
import { PageFetcherService } from './page-fetcher.service';
import { BrowserFetcherService } from './browser-fetcher.service';
import { SiteTechDetectorService } from './site-tech-detector.service';
import { MarkdownService } from './markdown.service';
import { PagesController, AnimalsController } from './pages.controller';

@Module({
  controllers: [PagesController, AnimalsController],
  providers: [PageFetcherService, BrowserFetcherService, SiteTechDetectorService, MarkdownService],
  exports: [PageFetcherService, BrowserFetcherService, SiteTechDetectorService, MarkdownService],
})
export class PagesModule {}
