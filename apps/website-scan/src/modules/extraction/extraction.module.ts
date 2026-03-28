import { Module } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { OrganizationExtractorService } from './organization-extractor.service';
import { AnimalExtractorService } from './animal-extractor.service';
import { PageClassifierService } from './page-classifier.service';

@Module({
  providers: [
    ExtractionService,
    OrganizationExtractorService,
    AnimalExtractorService,
    PageClassifierService,
  ],
  exports: [ExtractionService, AnimalExtractorService],
})
export class ExtractionModule {}
