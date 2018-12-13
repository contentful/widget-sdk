import * as MembershipUtils from './MembershipUtils.es6';

describe('MembershipUtils', () => {
  describe('#getRoleDescription', () => {
    const getRoleDescription = MembershipUtils.getRoleDescription;

    it('should return empty string if given nonexistent org role', () => {
      expect(getRoleDescription('')).toBe('');
      expect(getRoleDescription('whatever')).toBe('');
    });

    it('should return description if given valid org role', () => {
      expect(getRoleDescription('owner')).not.toBe('');
      expect(getRoleDescription('admin')).not.toBe('');
      expect(getRoleDescription('member')).not.toBe('');
    });
  });
});
