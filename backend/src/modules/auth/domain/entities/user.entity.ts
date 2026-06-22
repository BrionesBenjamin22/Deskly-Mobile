export const USER_ROLES = ['ADMIN', 'GESTOR', 'MIEMBRO'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export type MemberData = {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
};

export type UserProps = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRoleValue;
  active: boolean;
  member?: MemberData | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class User {
  constructor(private readonly props: UserProps) {}

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get username(): string { return this.props.username; }
  get passwordHash(): string { return this.props.passwordHash; }
  get role(): UserRoleValue { return this.props.role; }
  get active(): boolean { return this.props.active; }
  get member(): MemberData | null | undefined { return this.props.member; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
}
