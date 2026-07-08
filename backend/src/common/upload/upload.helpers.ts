import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

type MulterFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
};

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function createImageFileFilter() {
  return (_req: unknown, file: { mimetype: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('File must be JPG, JPEG, PNG, or WEBP'), false);
    }
    cb(null, true);
  };
}

export function createDocFileFilter() {
  return (_req: unknown, file: { mimetype: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      return cb(new Error('Document must be PDF or image'), false);
    }
    cb(null, true);
  };
}

export function createVideoFileFilter() {
  return (_req: unknown, file: { mimetype: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Video must be MP4, WEBM, or MOV'), false);
    }
    cb(null, true);
  };
}

export function createUploadStorage(subdir: string) {
  return diskStorage({
    destination: (_req: Request, _file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
      const dir = join(UPLOAD_ROOT, subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

export function toPublicUrl(relativePath: string): string {
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
}
