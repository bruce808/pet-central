import { Injectable, Logger } from '@nestjs/common';
import TurndownService from 'turndown';

@Injectable()
export class MarkdownService {
  private readonly logger = new Logger(MarkdownService.name);
  private readonly turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    this.turndown.addRule('removeScripts', {
      filter: ['script', 'style', 'noscript', 'iframe'],
      replacement: () => '',
    });

    this.turndown.addRule('images', {
      filter: 'img',
      replacement: (_content, node) => {
        const el = node as unknown as HTMLImageElement;
        const alt = el.getAttribute('alt') || '';
        const src = el.getAttribute('src') || '';
        return alt || src ? `![${alt}](${src})` : '';
      },
    });
  }

  async convertToMarkdown(
    html: string,
    _sourceUrl: string,
  ): Promise<string | null> {
    try {
      const bodyContent = this.extractBody(html);
      const markdown = this.turndown.turndown(bodyContent);
      return this.cleanMarkdown(markdown);
    } catch (error: any) {
      this.logger.warn(`Markdown conversion failed: ${error.message}`);
      return null;
    }
  }

  private extractBody(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1]! : html;
  }

  private cleanMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }
}
