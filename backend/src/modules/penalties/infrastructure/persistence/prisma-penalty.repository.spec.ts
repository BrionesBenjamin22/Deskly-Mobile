import {
  ACTIVE_PENALTIES_TO_BLOCK,
  BLOCK_DURATION_DAYS,
  calculateBlockedUntil,
  shouldBlockAccount,
} from './prisma-penalty.repository';

describe('Penalty account blocking policy', () => {
  it('keeps access with fewer than three active penalties', () => {
    expect(shouldBlockAccount(ACTIVE_PENALTIES_TO_BLOCK - 1)).toBe(false);
  });

  it('blocks access when three active penalties are accumulated', () => {
    expect(shouldBlockAccount(ACTIVE_PENALTIES_TO_BLOCK)).toBe(true);
  });

  it('keeps access blocked with more than three active penalties', () => {
    expect(shouldBlockAccount(ACTIVE_PENALTIES_TO_BLOCK + 1)).toBe(true);
  });

  it('does not block with zero active penalties', () => {
    expect(shouldBlockAccount(0)).toBe(false);
  });
});

describe('Block duration calculation', () => {
  it(`sets blockedUntil exactly ${BLOCK_DURATION_DAYS} days after the registered date`, () => {
    const registeredAt = new Date('2026-06-23T10:00:00.000Z');
    const blockedUntil = calculateBlockedUntil(registeredAt);

    const expectedDate = new Date('2026-06-30T10:00:00.000Z');
    expect(blockedUntil).toEqual(expectedDate);
  });

  it('does not mutate the original registeredAt date', () => {
    const registeredAt = new Date('2026-06-23T10:00:00.000Z');
    const originalTime = registeredAt.getTime();

    calculateBlockedUntil(registeredAt);

    expect(registeredAt.getTime()).toBe(originalTime);
  });

  it('handles month rollover correctly', () => {
    const registeredAt = new Date('2026-06-28T10:00:00.000Z');
    const blockedUntil = calculateBlockedUntil(registeredAt);

    const expectedDate = new Date('2026-07-05T10:00:00.000Z');
    expect(blockedUntil).toEqual(expectedDate);
  });

  it('handles year rollover correctly', () => {
    const registeredAt = new Date('2026-12-28T10:00:00.000Z');
    const blockedUntil = calculateBlockedUntil(registeredAt);

    const expectedDate = new Date('2027-01-04T10:00:00.000Z');
    expect(blockedUntil).toEqual(expectedDate);
  });
});
