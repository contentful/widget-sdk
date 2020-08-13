import { ssoName, idpSsoTargetUrl, idpCert } from './fieldErrorMessages';

describe('fieldErrorMessages', () => {
  describe('ssoName', () => {
    it('should show validation message if no error status', () => {
      expect(ssoName()).toBe(
        'Sign-in name format is not correct. Letters, numbers, periods, hyphens, and underscores are allowed.'
      );
    });

    it('should show api error if error status not 422', () => {
      expect(ssoName(409)).toBe('Could not update field. Try again.');
    });

    it('should tell user name is already taken if error status 422', () => {
      expect(ssoName(422)).toBe('This sign-in name is taken');
    });
  });

  describe('idpCert', () => {
    it('should show validation message if no error status', () => {
      expect(idpCert()).toBe('X.509 certificate format is not correct');
    });

    it('should show api error if error status', () => {
      expect(idpCert(409)).toBe('Could not update field. Try again.');
    });
  });

  describe('idpSsoTargetUrl', () => {
    it('should show validation message if no error status', () => {
      expect(idpSsoTargetUrl()).toBe('URL is not valid');
    });

    it('should show api error if error status', () => {
      expect(idpSsoTargetUrl(409)).toBe('Could not update field. Try again.');
    });
  });
});
