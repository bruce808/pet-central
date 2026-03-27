import { ResourceStatus, ResourceType } from './enums';

export interface CreateResourceDto {
  resourceType: ResourceType;
  title: string;
  slug: string;
  bodyMarkdown: string;
  tagsJson?: string[];
  organizationId?: string;
}

export type UpdateResourceDto = Partial<CreateResourceDto>;

export interface ResourceResponse {
  id: string;
  resourceType: ResourceType;
  title: string;
  slug: string;
  bodyMarkdown: string;
  status: ResourceStatus;
  tags: string[];
  author: {
    id: string;
    displayName: string;
  } | null;
  organization: {
    id: string;
    publicName: string;
  } | null;
  publishedAt: string | null;
  createdAt: string;
}
