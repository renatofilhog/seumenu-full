import { Readable } from 'stream';
import { StoreService } from './store.service';

describe('StoreService', () => {
  function createService(deps?: {
    findOne?: jest.Mock;
    find?: jest.Mock;
    save?: jest.Mock;
    update?: jest.Mock;
    delete?: jest.Mock;
    isPublicReadEnabled?: jest.Mock;
    getPublicUrl?: jest.Mock;
    getObject?: jest.Mock;
  }) {
    const storeRepository = {
      findOne: deps?.findOne ?? jest.fn(),
      find: deps?.find ?? jest.fn(),
      save: deps?.save ?? jest.fn(),
      update: deps?.update ?? jest.fn(),
      delete: deps?.delete ?? jest.fn(),
    };
    const storageService = {
      isPublicReadEnabled: deps?.isPublicReadEnabled ?? jest.fn().mockReturnValue(false),
      getPublicUrl: deps?.getPublicUrl ?? jest.fn(),
      getObject: deps?.getObject ?? jest.fn(),
    };

    return {
      service: new StoreService(storeRepository as any, storageService as any),
      storeRepository,
      storageService,
    };
  }

  it('rewrites private S3 media to stable backend paths for storefront responses', async () => {
    const find = jest.fn().mockResolvedValue([
      {
        id: 1,
        tenantId: 10,
        nome: 'Loja A',
        bannerUrl: 's3://uploads/tenant/10/stores/banner/file.png',
        logoUrl: 's3://uploads/tenant/10/stores/logo/file.png',
        ativo: true,
      },
    ]);
    const { service, storageService } = createService({ find });

    const stores = await service.findAll(10);

    expect(storageService.getPublicUrl).not.toHaveBeenCalled();
    expect(stores).toEqual([
      expect.objectContaining({
        bannerUrl: '/store/media/banner',
        logoUrl: '/store/media/logo',
      }),
    ]);
  });

  it('keeps external media urls unchanged', async () => {
    const find = jest.fn().mockResolvedValue([
      {
        id: 1,
        tenantId: 10,
        nome: 'Loja A',
        bannerUrl: 'https://cdn.example.com/banner.png',
        logoUrl: 'https://cdn.example.com/logo.png',
        ativo: true,
      },
    ]);
    const { service } = createService({ find });

    const stores = await service.findAll(10);

    expect(stores).toEqual([
      expect.objectContaining({
        bannerUrl: 'https://cdn.example.com/banner.png',
        logoUrl: 'https://cdn.example.com/logo.png',
      }),
    ]);
  });

  it('streams private store media from storage by tenant and media kind', async () => {
    const stream = Readable.from(Buffer.from('banner'));
    const findOne = jest.fn().mockResolvedValue({
      id: 1,
      tenantId: 10,
      nome: 'Loja A',
      bannerUrl: 's3://uploads/tenant/10/stores/banner/file.png',
      logoUrl: 'https://cdn.example.com/logo.png',
      ativo: true,
    });
    const getObject = jest.fn().mockResolvedValue({
      stream,
      contentType: 'image/png',
    });
    const { service, storageService } = createService({ findOne, getObject });

    const object = await service.getMediaStream('banner', 10);

    expect(storageService.getObject).toHaveBeenCalledWith(
      'uploads',
      'tenant/10/stores/banner/file.png',
    );
    expect(object).toEqual(
      expect.objectContaining({
        contentType: 'image/png',
        stream,
      }),
    );
  });

  it('returns null when store media is not backed by private storage', async () => {
    const findOne = jest.fn().mockResolvedValue({
      id: 1,
      tenantId: 10,
      nome: 'Loja A',
      bannerUrl: 'https://cdn.example.com/banner.png',
      logoUrl: '',
      ativo: true,
    });
    const { service, storageService } = createService({ findOne });

    const object = await service.getMediaStream('banner', 10);

    expect(storageService.getObject).not.toHaveBeenCalled();
    expect(object).toBeNull();
  });
});
