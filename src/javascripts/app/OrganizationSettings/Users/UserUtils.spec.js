import moment from 'moment';
import { getLastActivityDate, getFullNameOrEmail } from './UserUtils';

describe('UserUtils', () => {
  function createMembership(amount, unit) {
    const date = moment()
      .subtract(amount, unit)
      .toISOString();
    return { sys: { lastActiveAt: date } };
  }

  describe('lastActivityDate', () => {
    it('returns a relative time string', () => {
      const membership = createMembership(2, 'hour');
      const result = getLastActivityDate(membership);
      expect(result).toBe('2 hours ago');
    });

    it('has a minimum relative time', () => {
      let membership = createMembership(59, 'minute');
      let result = getLastActivityDate(membership);
      expect(result).toBe('Less than an hour ago');

      membership = createMembership(1, 'minute');
      result = getLastActivityDate(membership);
      expect(result).toBe('Less than an hour ago');
    });

    it('handles unavailable dates', () => {
      const membership = { sys: { lastActiveAt: null } };
      const result = getLastActivityDate(membership);
      expect(result).toBe('Never');
    });
  });

  describe('getFullNameOrEmail', () => {
    const named = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com'
    };
    const unnamed = {
      firstName: null,
      lastName: null,
      email: 'jane.doe@company.com'
    };

    it('should get the first name when available', () => {
      expect(getFullNameOrEmail(named)).toBe('John Doe');
    });
    it('should get the email when name is not available', () => {
      expect(getFullNameOrEmail(unnamed)).toBe('jane.doe@company.com');
    });
  });
});
