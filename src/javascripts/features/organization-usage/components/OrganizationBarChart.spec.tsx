import { accumulate, applyBorderStyle } from './OrganizationBarChart';

describe('OrganizationBarChart', () => {
  it('should apply the correct tranformation for [1, 2, 3]', () => {
    const data = [1, 2, 3];
    expect(accumulate(data)).toEqual([1, 3, 6]);
  });

  it('should return an empty array when input is an empty array', () => {
    const data = [];
    expect(accumulate(data)).toEqual([]);
  });

  it('should have zero borders for zero values', () => {
    const data = [0];
    expect(accumulate(data).map(applyBorderStyle)).toEqual([
      { value: 0, itemStyle: { borderWidth: 0 } },
    ]);
  });
});
