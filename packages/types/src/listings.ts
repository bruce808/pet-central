import {
  AdoptionOrSaleType,
  AvailabilityStatus,
  ListingStatus,
  OrgType,
  PetSex,
  PetType,
  SizeCategory,
} from './enums';

export interface CreatePetDto {
  petType: PetType;
  breedPrimary: string;
  breedSecondary?: string;
  speciesSubtype?: string;
  name: string;
  description: string;
  sex: PetSex;
  ageValue?: number;
  ageUnit?: string;
  birthDateEstimated?: string;
  sizeCategory?: SizeCategory;
  color?: string;
  temperament: string[];
  health: Record<string, unknown>;
  adoptionOrSaleType: AdoptionOrSaleType;
  attributes?: Record<string, string>;
}

export type UpdatePetDto = Partial<CreatePetDto>;

export interface CreateListingDto {
  petId: string;
  title: string;
  summary: string;
  feeAmount?: number;
  feeCurrency?: string;
  availableFrom?: string;
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateListingDto extends Partial<CreateListingDto> {
  listingStatus?: ListingStatus;
}

export interface PetResponse {
  id: string;
  petType: PetType;
  breedPrimary: string;
  breedSecondary: string | null;
  name: string;
  description: string;
  sex: PetSex;
  ageValue: number | null;
  ageUnit: string | null;
  sizeCategory: SizeCategory | null;
  color: string | null;
  temperament: string[];
  health: Record<string, unknown>;
  adoptionOrSaleType: AdoptionOrSaleType;
  attributes: Record<string, string>;
}

export interface MediaResponse {
  id: string;
  mediaType: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ListingResponse {
  id: string;
  pet: PetResponse;
  title: string;
  summary: string;
  feeAmount: number | null;
  feeCurrency: string | null;
  listingStatus: ListingStatus;
  availabilityStatus: AvailabilityStatus;
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  latitude: number | null;
  longitude: number | null;
  organization: {
    id: string;
    publicName: string;
    organizationType: OrgType;
  };
  trustRankSnapshot: number | null;
  publishedAt: string | null;
  media: MediaResponse[];
}

export interface UploadMediaDto {
  petId: string;
  mediaType: string;
  sortOrder?: number;
  isPrimary?: boolean;
}
