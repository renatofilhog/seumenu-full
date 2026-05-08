import { TenantResolutionMiddleware } from './tenant-resolution.middleware';

describe('TenantResolutionMiddleware', () => {
  function createMiddleware(deps?: {
    tenantFindOne?: jest.Mock;
    tenantDomainFindOne?: jest.Mock;
    jwtVerify?: jest.Mock;
  }) {
    const tenantRepository = {
      findOne: deps?.tenantFindOne ?? jest.fn(),
    };
    const tenantDomainRepository = {
      findOne: deps?.tenantDomainFindOne ?? jest.fn(),
    };
    const jwtService = {
      verify: deps?.jwtVerify ?? jest.fn(),
    };

    const middleware = new TenantResolutionMiddleware(
      tenantRepository as any,
      tenantDomainRepository as any,
      jwtService as any,
    );

    return {
      middleware,
      tenantRepository,
      tenantDomainRepository,
      jwtService,
    };
  }

  it('resolves tenant from signed tenant-context cookie before other strategies', async () => {
    const tenantFindOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 11, slug: 'cliente-a', nome: 'Cliente A' });
    const jwtVerify = jest.fn().mockReturnValue({
      tokenType: 'tenant_context',
      tenantId: 11,
      slug: 'cliente-a',
      nome: 'Cliente A',
    });
    const { middleware, tenantDomainRepository } = createMiddleware({
      tenantFindOne,
      jwtVerify,
    });

    const req = {
      headers: {
        cookie: 'seumenu_tenant_context=signed-token',
        host: 'localhost:3001',
      },
      hostname: 'localhost',
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(jwtVerify).toHaveBeenCalledWith('signed-token');
    expect(req.tenant).toEqual({
      id: 11,
      slug: 'cliente-a',
      nome: 'Cliente A',
      matchedBy: 'cookie',
    });
    expect(tenantDomainRepository.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('prefers authenticated user tenant over tenant-context cookie', async () => {
    const tenantFindOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 17, slug: 'cliente-b', nome: 'Cliente B' });
    const jwtVerify = jest.fn().mockReturnValue({
      sub: 99,
      email: 'admin@cliente-b.com',
      nome: 'Admin',
      principalType: 'app_user',
      tenantId: 17,
      permissions: [],
    });
    const { middleware } = createMiddleware({
      tenantFindOne,
      jwtVerify,
    });

    const req = {
      headers: {
        cookie: 'seumenu_tenant_context=signed-token',
        authorization: 'Bearer app-user-token',
        host: 'localhost:3001',
      },
      hostname: 'localhost',
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenant).toEqual({
      id: 17,
      slug: 'cliente-b',
      nome: 'Cliente B',
      matchedBy: 'auth_token',
    });
    expect(jwtVerify).toHaveBeenCalledWith('app-user-token');
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignores authenticated user tenant when request is explicitly marked as public storefront', async () => {
    const tenantFindOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 11, slug: 'cliente-a', nome: 'Cliente A' });
    const jwtVerify = jest
      .fn()
      .mockReturnValueOnce({
        tokenType: 'tenant_context',
        tenantId: 11,
        slug: 'cliente-a',
        nome: 'Cliente A',
      });
    const { middleware } = createMiddleware({
      tenantFindOne,
      jwtVerify,
    });

    const req = {
      headers: {
        cookie: 'seumenu_tenant_context=signed-token',
        authorization: 'Bearer app-user-token',
        host: 'localhost:3001',
        'x-tenant-context-mode': 'public',
      },
      hostname: 'localhost',
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenant).toEqual({
      id: 11,
      slug: 'cliente-a',
      nome: 'Cliente A',
      matchedBy: 'cookie',
    });
    expect(jwtVerify).toHaveBeenCalledTimes(1);
    expect(jwtVerify).toHaveBeenCalledWith('signed-token');
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when tenant-context cookie is invalid', async () => {
    const { middleware } = createMiddleware({
      jwtVerify: jest.fn(() => {
        throw new Error('invalid token');
      }),
    });

    const req = {
      headers: {
        cookie: 'seumenu_tenant_context=bad-token',
      },
      hostname: 'localhost',
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token de contexto do tenant invalido ou expirado',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to authenticated user tenant when request has bearer token but no tenant cookie', async () => {
    const tenantFindOne = jest
      .fn()
      .mockResolvedValue({ id: 17, slug: 'cliente-b', nome: 'Cliente B' });
    const jwtVerify = jest.fn().mockReturnValue({
      sub: 99,
      email: 'admin@cliente-b.com',
      nome: 'Admin',
      principalType: 'app_user',
      tenantId: 17,
      permissions: [],
    });
    const { middleware } = createMiddleware({
      tenantFindOne,
      jwtVerify,
    });

    const req = {
      headers: {
        host: 'localhost:3001',
        authorization: 'Bearer app-user-token',
      },
      hostname: 'localhost',
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenant).toEqual({
      id: 17,
      slug: 'cliente-b',
      nome: 'Cliente B',
      matchedBy: 'auth_token',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
