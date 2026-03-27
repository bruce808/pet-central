import type { PromptTemplate } from '../types.ts';

export class PromptRegistry {
  private templates = new Map<string, PromptTemplate[]>();

  register(template: PromptTemplate): void {
    const versions = this.templates.get(template.id) ?? [];
    const existingIdx = versions.findIndex(
      (t) => t.version === template.version,
    );

    if (existingIdx >= 0) {
      versions[existingIdx] = template;
    } else {
      versions.push(template);
      versions.sort((a, b) => a.version.localeCompare(b.version));
    }

    this.templates.set(template.id, versions);
  }

  get(id: string, version?: string): PromptTemplate | undefined {
    const versions = this.templates.get(id);
    if (!versions?.length) return undefined;

    if (version) {
      return versions.find((t) => t.version === version);
    }

    return versions[versions.length - 1];
  }

  render(
    id: string,
    variables: Record<string, string>,
    version?: string,
  ): { systemPrompt: string; userPrompt: string } {
    const template = this.get(id, version);
    if (!template) {
      throw new Error(
        `Prompt template not found: ${id}${version ? `@${version}` : ''}`,
      );
    }

    let systemPrompt = template.systemPrompt;
    let userPrompt = template.userPromptTemplate;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      systemPrompt = systemPrompt.replaceAll(placeholder, value);
      userPrompt = userPrompt.replaceAll(placeholder, value);
    }

    return { systemPrompt, userPrompt };
  }

  listTemplates(): PromptTemplate[] {
    const all: PromptTemplate[] = [];
    for (const versions of this.templates.values()) {
      all.push(...versions);
    }
    return all;
  }
}

export const DEFAULT_REGISTRY = new PromptRegistry();
