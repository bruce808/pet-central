import {
  OrgType,
  PetSex,
  PetType,
  SizeCategory,
  TrustState,
} from './enums';
import { PaginationQuery } from './common';

export interface SearchListingsQuery extends PaginationQuery {
  query?: string;
  petType?: PetType;
  breed?: string;
  location?: string;
  radiusKm?: number;
  orgType?: OrgType;
  trustLevel?: string;
  minAge?: number;
  maxAge?: number;
  sex?: PetSex;
  sizeCategory?: SizeCategory;
  temperament?: string[];
  minFee?: number;
  maxFee?: number;
  goodWithKids?: boolean;
  goodWithPets?: boolean;
  apartmentFriendly?: boolean;
  sortBy?: 'relevance' | 'newest' | 'distance' | 'trust_score' | 'review_score';
}

export interface SearchOrganizationsQuery extends PaginationQuery {
  query?: string;
  orgType?: OrgType;
  location?: string;
  radiusKm?: number;
  trustState?: TrustState;
  sortBy?: string;
}

export interface FacetBucket {
  key: string;
  count: number;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  facets?: Record<string, FacetBucket[]>;
}
