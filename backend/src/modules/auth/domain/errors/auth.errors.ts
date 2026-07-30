export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Refresh token is invalid or expired.');
    this.name = 'InvalidRefreshTokenError';
    Object.setPrototypeOf(this, InvalidRefreshTokenError.prototype);
  }
}
export class InactiveUserError extends Error {}
export class BlockedUserError extends Error {
  constructor(readonly blockedUntil: Date) {
    super('User is blocked until ' + blockedUntil.toISOString());
  }
}
export class InvalidCurrentPasswordError extends Error {}
export class UserAlreadyExistsError extends Error {}
export class MemberDataRequiredError extends Error {}
export class UserNotFoundError extends Error {}
export class SelfRoleChangeForbiddenError extends Error {}
export class SelfDeactivationForbiddenError extends Error {}
export class LastActiveAdminError extends Error {}
export class UserAlreadyInactiveError extends Error {}
export class SystemNotInitializedError extends Error {
  constructor() {
    super('System administrator bootstrap is required.');
    this.name = 'SystemNotInitializedError';
    Object.setPrototypeOf(this, SystemNotInitializedError.prototype);
  }
}
