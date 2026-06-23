export const PENALTY_TYPES = ['ABSENCE', 'LATE_CANCELLATION'] as const;
export const INFRACTION_LEVELS = ['WARNING', 'PENALTY'] as const;

export type PenaltyTypeValue = (typeof PENALTY_TYPES)[number];
export type InfractionLevelValue = (typeof INFRACTION_LEVELS)[number];

export type PenaltyProperties = {
  id: string;
  reservationId: string;
  memberId: string;
  registeredById: string | null;
  type: PenaltyTypeValue;
  level: InfractionLevelValue;
  reason: string;
  registeredAt: Date;
  activeUntil: Date;
};

export class Penalty {
  constructor(private readonly properties: PenaltyProperties) {}

  get id() {
    return this.properties.id;
  }
  get reservationId() {
    return this.properties.reservationId;
  }
  get memberId() {
    return this.properties.memberId;
  }
  get registeredById() {
    return this.properties.registeredById;
  }
  get type() {
    return this.properties.type;
  }
  get level() {
    return this.properties.level;
  }
  get reason() {
    return this.properties.reason;
  }
  get registeredAt() {
    return this.properties.registeredAt;
  }
  get activeUntil() {
    return this.properties.activeUntil;
  }
  get active() {
    return this.properties.activeUntil.getTime() > Date.now();
  }
}
