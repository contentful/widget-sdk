import moment from 'moment';
import { getLastActivityDate } from './UserUtils.es6';

describe('UserUtils', () => {
  function getMembership(amount, unit) {
    const date = moment()
      .subtract(amount, unit)
      .toISOString();
    return { sys: { lastActiveAt: date } };
  }

  it('returns a relative time string', () => {
    const membership = getMembership(2, 'hour');
    const result = getLastActivityDate(membership);
    expect(result).toBe('2 hours ago');
  });

  it('has a minimum relative time', () => {
    let membership = getMembership(59, 'minute');
    let result = getLastActivityDate(membership);
    expect(result).toBe('Less than an hour ago');

    membership = getMembership(1, 'minute');
    result = getLastActivityDate(membership);
    expect(result).toBe('Less than an hour ago');
  });

  it('handles unavailable dates', () => {
    const membership = { sys: { lastActiveAt: null } };
    const result = getLastActivityDate(membership);
    expect(result).toBe('Not available');
  });
});
