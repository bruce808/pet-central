import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Controller('pages')
export class PagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getPage(@Param('id') id: string) {
    const page = await this.prisma.scanPage.findUnique({
      where: { id },
      include: {
        markdown: true,
        extractions: true,
        animalListingsFromSource: { select: { id: true, name: true, animalType: true } },
        animalListingsFromDetail: { select: { id: true, name: true, animalType: true } },
      },
    });
    if (!page) throw new NotFoundException('Scan page not found');
    return page;
  }

  @Get(':id/markdown')
  async getPageMarkdown(@Param('id') id: string) {
    const markdown = await this.prisma.scanPageMarkdown.findUnique({
      where: { scanPageId: id },
    });
    if (!markdown) throw new NotFoundException('Markdown not found for this page');
    return markdown;
  }

  @Get(':id/extractions')
  async getPageExtractions(@Param('id') id: string) {
    return this.prisma.scanPageExtraction.findMany({
      where: { scanPageId: id },
      orderBy: { createdAt: 'asc' },
    });
  }
}

@Controller('animals')
export class AnimalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getAnimal(@Param('id') id: string) {
    const animal = await this.prisma.scanAnimalListing.findUnique({
      where: { id },
      include: {
        markdown: true,
        evidence: true,
        sourcePage: { select: { id: true, url: true, title: true, pageType: true } },
        detailPage: { select: { id: true, url: true, title: true, pageType: true } },
        scan: { select: { id: true, websiteId: true, website: { select: { domain: true } } } },
      },
    });
    if (!animal) throw new NotFoundException('Animal listing not found');
    return animal;
  }
}
