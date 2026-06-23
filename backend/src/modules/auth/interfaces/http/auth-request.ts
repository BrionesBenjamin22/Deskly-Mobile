import { Request } from 'express';
import { PublicUserOutput } from '../../application/dto/auth.output';

export type AuthenticatedRequest = Request & { user: PublicUserOutput };
