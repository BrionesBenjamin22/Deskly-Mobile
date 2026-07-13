export type ReservationStatusValue =
  | 'RESERVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReservationProperties = {
  id?: string;
  deskId: string;
  memberId: string;
  memberFullName?: string;
  deskCode?: string;
  deskName?: string | null;
  areaId?: string;
  areaName?: string;
  localityId?: string;
  localityName?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatusValue;
  createdAt?: Date;
  updatedAt?: Date;
  cancelledAt?: Date | null;
  checkedInAt?: Date | null;
};

export class Reservation {
  constructor(private readonly properties: ReservationProperties) {}

  get id(): string | undefined {
    return this.properties.id;
  }

  get deskId(): string {
    return this.properties.deskId;
  }

  get memberId(): string {
    return this.properties.memberId;
  }

  get memberFullName(): string | undefined {
    return this.properties.memberFullName;
  }

  get deskCode(): string | undefined {
    return this.properties.deskCode;
  }

  get deskName(): string | null | undefined {
    return this.properties.deskName;
  }

  get areaId(): string | undefined {
    return this.properties.areaId;
  }

  get areaName(): string | undefined {
    return this.properties.areaName;
  }

  get localityId(): string | undefined {
    return this.properties.localityId;
  }

  get localityName(): string | undefined {
    return this.properties.localityName;
  }

  get address(): string | null | undefined {
    return this.properties.address;
  }

  get latitude(): number | null | undefined {
    return this.properties.latitude;
  }

  get longitude(): number | null | undefined {
    return this.properties.longitude;
  }

  get date(): string {
    return this.properties.date;
  }

  get startTime(): string {
    return this.properties.startTime;
  }

  get endTime(): string {
    return this.properties.endTime;
  }

  get status(): ReservationStatusValue {
    return this.properties.status;
  }

  get createdAt(): Date | undefined {
    return this.properties.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.properties.updatedAt;
  }

  get cancelledAt(): Date | null | undefined {
    return this.properties.cancelledAt;
  }

  get checkedInAt(): Date | null | undefined {
    return this.properties.checkedInAt;
  }
}
