export type PaymentProperties = {
  id?: string;
  reservationId: string;
  date: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export class Payment {
  constructor(private readonly properties: PaymentProperties) {}

  get id(): string | undefined {
    return this.properties.id;
  }

  get reservationId(): string {
    return this.properties.reservationId;
  }

  get date(): string {
    return this.properties.date;
  }

  get amount(): number {
    return this.properties.amount;
  }

  get createdAt(): Date | undefined {
    return this.properties.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.properties.updatedAt;
  }
}
