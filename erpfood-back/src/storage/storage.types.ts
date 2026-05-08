import { Readable } from 'stream';

export type UploadObjectInput = {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
};

export type UploadObjectResult = {
  bucket: string;
  key: string;
  etag?: string;
  size: number;
  contentType?: string;
};

export type GetObjectResult = {
  contentType?: string;
  contentLength?: number;
  etag?: string;
  stream: Readable;
};
