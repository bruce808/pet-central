import { PetType, UserStatus } from './enums';

export interface UserProfileDto {
  displayName: string;
  avatarUrl?: string;
  city?: string;
  stateRegion?: string;
  country?: string;
  bio?: string;
}

export type UpdateProfileDto = Partial<UserProfileDto>;

export interface UserPreferencesDto {
  preferredPetTypes: PetType[];
  preferredBreeds: string[];
  maxDistance?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  goodWithKids?: boolean;
  goodWithPets?: boolean;
  apartmentFriendly?: boolean;
}

export interface FavoriteDto {
  listingId: string;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  stateRegion: string | null;
  country: string | null;
  status: UserStatus;
  createdAt: string;
}
