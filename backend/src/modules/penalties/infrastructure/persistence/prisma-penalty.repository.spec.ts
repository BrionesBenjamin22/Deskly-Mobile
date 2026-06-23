import {
  ACTIVE_PENALTIES_TO_BLOCK,
  shouldBlockAccount,
} from './prisma-penalty.repository';

describe('Penalty account blocking policy', () => {
  it('keeps access with fewer than three active penalties', () => {
    expect(shouldBlockAccount(ACTIVE_PENALTIES_TO_BLOCK - 1)).toBe(false);
  });

  it('blocks access when three active penalties are accumulated', () => {
    expect(shouldBlockAccount(ACTIVE_PENALTIES_TO_BLOCK)).toBe(true);
  });
});
