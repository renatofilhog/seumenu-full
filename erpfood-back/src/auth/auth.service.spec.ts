import { AuthService } from './auth.service';

describe('AuthService', () => {
  function createService(deps?: {
    userFindOne?: jest.Mock;
    tenantFindOne?: jest.Mock;
    tenantUserFindOne?: jest.Mock;
    saasFindOne?: jest.Mock;
    jwtSign?: jest.Mock;
  }) {
    const userRepository = {
      findOne: deps?.userFindOne ?? jest.fn(),
    };
    const tenantRepository = {
      findOne: deps?.tenantFindOne ?? jest.fn(),
    };
    const tenantUserRepository = {
      findOne: deps?.tenantUserFindOne ?? jest.fn(),
    };
    const saasManagementUserRepository = {
      findOne: deps?.saasFindOne ?? jest.fn(),
    };
    const jwtService = {
      sign: deps?.jwtSign ?? jest.fn().mockReturnValue('signed-jwt'),
    };
    const passwordService = {
      verify: jest.fn(async (value: string, persisted: string) => value === persisted),
    };

    const service = new AuthService(
      userRepository as any,
      tenantRepository as any,
      tenantUserRepository as any,
      saasManagementUserRepository as any,
      jwtService as any,
      passwordService as any,
    );

    return {
      service,
      userRepository,
      tenantRepository,
      tenantUserRepository,
      saasManagementUserRepository,
      jwtService,
      passwordService,
    };
  }

  it('logs in app user using tenant bound directly on user record', async () => {
    const userFindOne = jest.fn().mockResolvedValue({
      id: 7,
      nome: 'Admin',
      email: 'admin@cliente.com',
      senha: '123456',
      tenantId: 15,
      forcePasswordChange: false,
      role: {
        id: 3,
        nome: 'admin',
        permissions: [{ nome: 'dashboard.read' }],
      },
    });
    const tenantFindOne = jest
      .fn()
      .mockResolvedValue({ id: 15, nome: 'Cliente 15', slug: 'cliente-15', ativo: true });
    const { service, tenantUserRepository, jwtService } = createService({
      userFindOne,
      tenantFindOne,
    });

    const response = await service.login('admin@cliente.com', '123456');

    expect(response.tenant).toEqual({
      id: 15,
      nome: 'Cliente 15',
      slug: 'cliente-15',
    });
    expect(tenantUserRepository.findOne).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        principalType: 'app_user',
        tenantId: 15,
      }),
    );
  });

  it('falls back to first active tenant membership when user has no tenantId column', async () => {
    const userFindOne = jest.fn().mockResolvedValue({
      id: 9,
      nome: 'Operador',
      email: 'operador@cliente.com',
      senha: 'senha',
      tenantId: null,
      forcePasswordChange: true,
      role: {
        id: 4,
        nome: 'manager',
        permissions: [],
      },
    });
    const tenantUserFindOne = jest.fn().mockResolvedValue({
      tenant: {
        id: 22,
        nome: 'Cliente 22',
        slug: 'cliente-22',
        ativo: true,
      },
    });
    const { service, tenantRepository } = createService({
      userFindOne,
      tenantUserFindOne,
    });

    const response = await service.login('operador@cliente.com', 'senha');

    expect(response.tenant).toEqual({
      id: 22,
      nome: 'Cliente 22',
      slug: 'cliente-22',
    });
    expect(tenantRepository.findOne).not.toHaveBeenCalled();
  });
});
