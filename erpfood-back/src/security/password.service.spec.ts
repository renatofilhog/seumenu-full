import { PasswordService } from './password.service';

describe('PasswordService', () => {
  it('hashes and verifies a password', async () => {
    const service = new PasswordService();

    const hashed = await service.hash('segredo-123');

    expect(hashed).toMatch(/^scrypt\$/);
    await expect(service.verify('segredo-123', hashed)).resolves.toBe(true);
    await expect(service.verify('outra-senha', hashed)).resolves.toBe(false);
  });

  it('keeps backward compatibility with plain text values during migration window', async () => {
    const service = new PasswordService();

    await expect(service.verify('admin', 'admin')).resolves.toBe(true);
    await expect(service.verify('senha', 'admin')).resolves.toBe(false);
  });
});
