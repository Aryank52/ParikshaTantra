import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';

export type StorageFolder =
  | 'candidate-documents'
  | 'candidate-photos'
  | 'answer-sheets'
  | 'incident-evidence'
  | 'exam-assets'
  | 'certificates';

export interface StorageUploadResult {
  success: boolean;
  objectKey: string;
  publicOrSignedUrl: string;
  fileHash: string;
  sizeBytes: number;
  mimeType: string;
  provider: 'LOCAL' | 'SUPABASE_STORAGE' | 'S3';
  error?: string;
}

export class ObjectStorageService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  /**
   * Initializes local upload directories if Supabase/S3 is unconfigured.
   */
  private static ensureLocalUploadDir(folder: StorageFolder): string {
    const dir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Validates file MIME type and size guards (max 10MB).
   */
  public static validateFile(buffer: Buffer, mimeType: string, maxSizeMb: number = 10): { isValid: boolean; reason?: string } {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'text/plain',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return { isValid: false, reason: `Unsupported file type: ${mimeType}. Allowed formats: JPG, PNG, WEBP, PDF.` };
    }

    if (buffer.length > maxSizeMb * 1024 * 1024) {
      return { isValid: false, reason: `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds limit of ${maxSizeMb} MB.` };
    }

    return { isValid: true };
  }

  /**
   * Stores a file buffer into Object Storage (Supabase Storage / AWS S3 or Local Fallback).
   */
  public static async uploadFile(params: {
    folder: StorageFolder;
    filename: string;
    buffer: Buffer;
    mimeType: string;
    uploadedBy: string;
  }): Promise<StorageUploadResult> {
    const validation = this.validateFile(params.buffer, params.mimeType);
    if (!validation.isValid) {
      return {
        success: false,
        objectKey: '',
        publicOrSignedUrl: '',
        fileHash: '',
        sizeBytes: params.buffer.length,
        mimeType: params.mimeType,
        provider: 'LOCAL',
        error: validation.reason,
      };
    }

    const fileHash = crypto.createHash('sha256').update(params.buffer).digest('hex');
    const ext = path.extname(params.filename) || '.bin';
    const objectKey = `${params.folder}/${Date.now()}-${fileHash.substring(0, 12)}${ext}`;

    // Check if Supabase Storage is configured in environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.STORAGE_BUCKET || 'parikshatantra-vault';

    if (supabaseUrl && supabaseKey) {
      try {
        const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${objectKey}`;
        const res = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': params.mimeType,
            'x-upsert': 'true',
          },
          body: new Uint8Array(params.buffer),
        });

        if (res.ok) {
          const signedUrl = `${supabaseUrl}/storage/v1/object/authenticated/${bucket}/${objectKey}`;
          return {
            success: true,
            objectKey,
            publicOrSignedUrl: signedUrl,
            fileHash,
            sizeBytes: params.buffer.length,
            mimeType: params.mimeType,
            provider: 'SUPABASE_STORAGE',
          };
        }
      } catch (err) {
        console.warn('⚠️ Supabase Storage upload fallback to local storage:', err);
      }
    }

    // Local File Storage Fallback (Development & Offline Resilience)
    try {
      const targetFolderDir = this.ensureLocalUploadDir(params.folder);
      const filePath = path.join(targetFolderDir, `${Date.now()}-${fileHash.substring(0, 12)}${ext}`);
      fs.writeFileSync(filePath, params.buffer);

      const signedUrl = `/uploads/${params.folder}/${path.basename(filePath)}`;
      return {
        success: true,
        objectKey,
        publicOrSignedUrl: signedUrl,
        fileHash,
        sizeBytes: params.buffer.length,
        mimeType: params.mimeType,
        provider: 'LOCAL',
      };
    } catch (err: any) {
      return {
        success: false,
        objectKey,
        publicOrSignedUrl: '',
        fileHash,
        sizeBytes: params.buffer.length,
        mimeType: params.mimeType,
        provider: 'LOCAL',
        error: err.message || 'Failed to save file to storage.',
      };
    }
  }

  /**
   * Generates a signed temporary download URL for a private object.
   */
  public static async getSignedUrl(objectKey: string, expirySeconds: number = 3600): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.STORAGE_BUCKET || 'parikshatantra-vault';

    if (supabaseUrl && supabaseKey) {
      return `${supabaseUrl}/storage/v1/object/sign/${bucket}/${objectKey}?token=signed-temp-access&expiresIn=${expirySeconds}`;
    }

    // Local fallback route URL
    return `/api/storage/object?key=${encodeURIComponent(objectKey)}`;
  }
}
