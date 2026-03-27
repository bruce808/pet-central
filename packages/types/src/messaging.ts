import {
  ConversationType,
  MessageType,
  ModerationStatus,
  OrgType,
  ParticipantRole,
} from './enums';

export interface CreateConversationDto {
  organizationId: string;
  listingId?: string;
  initialMessage: string;
}

export interface SendMessageDto {
  bodyText: string;
  messageType?: MessageType;
}

export interface MessageResponse {
  id: string;
  senderUserId: string;
  senderDisplayName: string;
  bodyText: string;
  messageType: MessageType;
  moderationStatus: ModerationStatus;
  attachments: {
    id: string;
    url: string;
    fileName: string;
    mimeType: string;
  }[];
  createdAt: string;
}

export interface ConversationParticipantResponse {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  participantRole: ParticipantRole;
  lastReadAt: string | null;
}

export interface ConversationResponse {
  id: string;
  conversationType: ConversationType;
  listing: {
    id: string;
    title: string;
    petName: string;
  } | null;
  organization: {
    id: string;
    publicName: string;
    organizationType: OrgType;
  } | null;
  participants: ConversationParticipantResponse[];
  lastMessage: MessageResponse | null;
  unreadCount: number;
  createdAt: string;
}
