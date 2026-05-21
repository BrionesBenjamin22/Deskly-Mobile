export type ReservationStatusValue = 'ACTIVE' | 'CANCELLED';

export type ReservationProperties = {
  id?: string;
  deskId: string;
  deskCode?: string;
  deskName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatusValue;
  createdAt?: Date;
  updatedAt?: Date;
  cancelledAt?: Date | null;
};

export class Reservation {
  constructor(private readonly properties: ReservationProperties) {}

  get id(): string | undefined {
    return this.properties.id;
  }

  get deskId(): string {
    return this.properties.deskId;
  }

  get deskCode(): string | undefined {
    return this.properties.deskCode;
  }

  get deskName(): string | null | undefined {
    return this.properties.deskName;
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
}
