import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

describe('UserService', () => {
  function createService(deps?: {
    userFindOne?: jest.Mock;
    userSave?: jest.Mock;
    roleFindOneBy?: jest.Mock;
    passwordVerify?: jest.Mock;
    passwordHash?: jest.Mock;
  }) {
    const userRepository = {
      findOne: deps?.userFindOne ?? jest.fn(),
      save: deps?.userSave ?? jest.fn(async (value) => value),
      create: jest.fn((value) => value),
      delete: jest.fn(),
      find: jest.fn(),
    };
    const roleRepository = {
      findOneBy: deps?.roleFindOneBy ?? jest.fn(),
    };
    const passwordService = {
      verify: deps?.passwordVerify ?? jest.fn(async () => true),
      hash: deps?.passwordHash ?? jest.fn(async (value: string) => `hashed:${value}`),
    };

    const service = new UserService(
      userRepository as any,
      roleRepository as any,
      passwordService as any,
    );

    return {
      service,
      userRepository,
      roleRepository,
      passwordService,
    };
  }

  it('allows first access password change without current password when force flag is enabled', async () => {
    const userSave = jest.fn(async (value) => value);
    const { service, passwordService } = createService({
      userFindOne: jest.fn().mockResolvedValue({
        id: 10,
        tenantId: 5,
        senha: 'hashed:temp',
        forcePasswordChange: true,
      }),
      userSave,
    });

    const result = await service.changeCurrentPassword(10, 5, {
      newPassword: 'nova-123',
      confirmPassword: 'nova-123',
    });

    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(passwordService.hash).toHaveBeenCalledWith('nova-123');
    expect(userSave).toHaveBeenCalledWith(
      expect.objectContaining({
        senha: 'hashed:nova-123',
        forcePasswordChange: false,
      }),
    );
    expect(result).toEqual({ success: true, forcePasswordChange: false });
  });

  it('requires current password for normal password changes', async () => {
    const { service } = createService({
      userFindOne: jest.fn().mockResolvedValue({
        id: 12,
        tenantId: 9,
        senha: 'hashed:real',
        forcePasswordChange: false,
      }),
    });

    await expect(
      service.changeCurrentPassword(12, 9, {
        newPassword: 'nova-123',
        confirmPassword: 'nova-123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects wrong current password for normal changes', async () => {
    const { service } = createService({
      userFindOne: jest.fn().mockResolvedValue({
        id: 12,
        tenantId: 9,
        senha: 'hashed:real',
        forcePasswordChange: false,
      }),
      passwordVerify: jest.fn(async () => false),
    });

    await expect(
      service.changeCurrentPassword(12, 9, {
        currentPassword: 'errada',
        newPassword: 'nova-123',
        confirmPassword: 'nova-123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when authenticated user is not found for tenant', async () => {
    const { service } = createService({
      userFindOne: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.changeCurrentPassword(99, 7, {
        currentPassword: 'atual',
        newPassword: 'nova-123',
        confirmPassword: 'nova-123',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
