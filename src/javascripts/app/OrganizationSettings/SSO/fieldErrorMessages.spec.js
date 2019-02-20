import * as fieldErrorMessages from './fieldErrorMessages.es6';

describe('fieldErrorMessages', () => {
  describe('#ssoName', () => {
    it('should return different errors based on if it is via the API', () => {
      const apiError = fieldErrorMessages.ssoName({ api: true });
      const nonApiError = fieldErrorMessages.ssoName();

      expect(apiError).toBeInstanceOf(Error);
      expect(nonApiError).toBeInstanceOf(Error);

      expect(apiError.message).not.toBe(nonApiError.message);
    });
  });

  describe('#idpCert', () => {
    it('should return an error', () => {
      expect(fieldErrorMessages.idpCert()).toBeInstanceOf(Error);
    });
  });

  describe('#idpSsoTargetUrl', () => {
    it('should return an error', () => {
      expect(fieldErrorMessages.idpSsoTargetUrl()).toBeInstanceOf(Error);
    });
  });
});
