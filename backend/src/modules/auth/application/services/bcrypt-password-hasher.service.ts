import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherPort {
  private readonly rounds = 12;

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.rounds);
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
