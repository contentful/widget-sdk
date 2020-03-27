import periodToDates from './periodToDates';

describe('periodToDates', () => {
  const defaultPeriod = {
    startDate: '2020-03-10',
    endDate: '2020-03-12',
  };

  it('should format dates as expected', () => {
    expect(periodToDates(defaultPeriod)).toEqual(['10 Mar', '11 Mar', '12 Mar']);
  });

  it('should return formatted dates for the current period if no end date', () => {
    defaultPeriod.endDate = null;
    const dates = periodToDates(defaultPeriod);
    expect(dates).toHaveLength(31); //31 days in March
    expect(dates[0]).toBe('10 Mar');
    expect(dates.pop()).toBe('9 Apr');
  });
});
