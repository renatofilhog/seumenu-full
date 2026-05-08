import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const PASSWORD_PREFIX = 'scrypt';
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hash(value: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer;
    return `${PASSWORD_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
  }

  async verify(value: string, persistedValue: string): Promise<boolean> {
    if (!this.isHashed(persistedValue)) {
      return value === persistedValue;
    }

    const [, salt, expectedHash] = persistedValue.split('$');
    const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer;
    const expected = Buffer.from(expectedHash, 'hex');
    if (expected.length !== derivedKey.length) {
      return false;
    }
    return timingSafeEqual(expected, derivedKey);
  }

  isHashed(value?: string | null): boolean {
    if (!value) {
      return false;
    }

    const [prefix, salt, hash] = value.split('$');
    return prefix === PASSWORD_PREFIX && Boolean(salt) && Boolean(hash);
  }
}
