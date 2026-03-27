import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

type UploadPurpose = 'pet-media' | 'document' | 'avatar' | 'attachment';

interface SignedUploadDto {
  fileName: string;
  contentType: string;
  purpose: UploadPurpose;
}

const ALLOWED_TYPES: Record<UploadPurpose, string[]> = {
  'pet-media': [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
  ],
  document: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  attachment: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ],
};

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
    this.bucket = process.env.S3_BUCKET ?? 'pet-central-uploads';
  }

  async getSignedUploadUrl(userId: string, dto: SignedUploadDto) {
    const allowed = ALLOWED_TYPES[dto.purpose];
    if (!allowed || !allowed.includes(dto.contentType)) {
      throw new BadRequestException(
        `Content type "${dto.contentType}" is not allowed for purpose "${dto.purpose}"`,
      );
    }

    const storageKey = `${dto.purpose}/${userId}/${randomUUID()}/${dto.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: dto.contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    const expiresAt = new Date(Date.now() + 900 * 1000).toISOString();

    return { uploadUrl, storageKey, expiresAt };
  }
}
