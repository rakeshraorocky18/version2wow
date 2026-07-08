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

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function imageFileFilter(_req: unknown, file: { mimetype: string }, cb: (error: Error | null, acceptFile: boolean) => void) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new Error('Profile photo must be JPG, JPEG, PNG, or WEBP'), false);
  }
  cb(null, true);
}

export function resumeFileFilter(_req: unknown, file: { mimetype: string }, cb: (error: Error | null, acceptFile: boolean) => void) {
  if (!ALLOWED_RESUME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Resume must be PDF or Word document'), false);
  }
  cb(null, true);
}

export const wizardUploadStorage = diskStorage({
  destination: (_req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
    const subdir = file.fieldname === 'resume' ? 'resumes' : 'profiles';
    const dir = join(UPLOAD_ROOT, subdir);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
    const ext = extname(file.originalname).toLowerCase() || (file.fieldname === 'resume' ? '.pdf' : '.jpg');
    cb(null, `${uuidv4()}${ext}`);
  },
});

/** @deprecated use wizardUploadStorage */
export const profilePhotoStorage = wizardUploadStorage;

export function toPublicUrl(relativePath: string): string {
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
}
