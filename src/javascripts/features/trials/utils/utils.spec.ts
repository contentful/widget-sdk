import { calcTrialDaysLeft } from './utils';

const today = '2019-10-01T03:00:00.000Z';
const endDate = '2019-10-21';

describe('calcTrialDaysLeft', () => {
  beforeEach(() => {
    const now = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  it('should return a correct number of days till the trial ends', () => {
    expect(calcTrialDaysLeft(endDate)).toBe(20);
  });

  it('should return 0 if the trial ends today', () => {
    expect(calcTrialDaysLeft(today)).toBe(0);
  });
});
