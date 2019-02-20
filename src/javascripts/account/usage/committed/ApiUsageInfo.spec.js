import { calcRelativeSpaceUsage } from './ApiUsageInfo.es6';

describe('calcRelativeSpaceUsage', () => {
  it('should return correct relative space usage for values > 0', () => {
    expect(calcRelativeSpaceUsage([2, 3, 5], 100)).toBe(10);
    expect(calcRelativeSpaceUsage([5, 5, 5], 300)).toBe(5);
  });

  it('should return correct relative space usage for 0 usage', () => {
    expect(calcRelativeSpaceUsage([0], 100)).toBe(0);
    expect(calcRelativeSpaceUsage([0], 0)).toBe(0);
  });
});
