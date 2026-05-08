import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  beforeEach(() => {
    process.env.S3_BUCKET = 'uploads';
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_PUBLIC_BASE_URL = 'http://localhost:9000';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY = 'minio';
    process.env.S3_SECRET_KEY = 'minio12345';
    process.env.S3_FORCE_PATH_STYLE = 'true';
    process.env.S3_PUBLIC_READ = 'false';
    process.env.S3_AUTO_CREATE_BUCKET = 'false';
  });

  it('creates bucket when head check fails', async () => {
    const service = new StorageService();
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('not-found'))
      .mockResolvedValueOnce({});
    (service as any).client = { send };

    await service.ensureBucketExists('uploads');

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('uploads object and returns metadata', async () => {
    const service = new StorageService();
    const send = jest.fn().mockResolvedValue({ ETag: '"abc123"' });
    (service as any).client = { send };

    const result = await service.uploadObject({
      bucket: 'uploads',
      key: 'tenant/1/files/a.txt',
      body: Buffer.from('hello'),
      contentType: 'text/plain',
    });

    expect(result).toEqual({
      bucket: 'uploads',
      key: 'tenant/1/files/a.txt',
      etag: 'abc123',
      size: 5,
      contentType: 'text/plain',
    });
  });

  it('builds public url using path style', () => {
    const service = new StorageService();
    expect(service.getPublicUrl('uploads', 'tenant/1/files/a.png')).toBe(
      'http://localhost:9000/uploads/tenant/1/files/a.png',
    );
  });

  it('does not duplicate the bucket when public base url already includes it in the host', () => {
    process.env.S3_ENDPOINT = 'https://s3.amazonaws.com';
    process.env.S3_PUBLIC_BASE_URL = 'https://storage-seumenu.s3.us-east-1.amazonaws.com';
    process.env.S3_BUCKET = 'storage-seumenu';
    process.env.S3_FORCE_PATH_STYLE = 'false';

    const service = new StorageService();

    expect(service.getPublicUrl('storage-seumenu', 'tenant/global/files/a.png')).toBe(
      'https://storage-seumenu.s3.us-east-1.amazonaws.com/tenant/global/files/a.png',
    );
  });

  it('does not duplicate the bucket when public base url already includes it in the path', () => {
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_PUBLIC_BASE_URL = 'http://localhost:9000/uploads';
    process.env.S3_BUCKET = 'uploads';
    process.env.S3_FORCE_PATH_STYLE = 'true';

    const service = new StorageService();

    expect(service.getPublicUrl('uploads', 'tenant/1/files/a.png')).toBe(
      'http://localhost:9000/uploads/tenant/1/files/a.png',
    );
  });

  it('returns presigned url from sdk helper', async () => {
    const service = new StorageService();
    const send = jest.fn();
    (service as any).client = { send };
    (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://signed-url');

    const url = await service.getPresignedUrl('uploads', 'tenant/1/files/a.png');

    expect(url).toBe('https://signed-url');
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
  });
});
