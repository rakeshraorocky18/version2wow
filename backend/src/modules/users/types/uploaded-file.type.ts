export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  filename: string;
  path?: string;
  buffer?: Buffer;
  size: number;
}
