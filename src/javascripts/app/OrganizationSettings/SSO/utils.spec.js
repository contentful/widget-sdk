import * as utils from './utils.es6';

jest.mock('./validators.es6', () => ({
  myAwesomeField: (str) => {
    if (str === 'secret') {
      return `${str} is valid!`;
    } else {
      return null;
    }
  }
}));

describe('SSO utils', () => {
  describe('#validate', () => {
    it('should return true if no validator exists for given fieldName', () => {
      expect(utils.validate('aDifferentField', 'some value')).toBe(true);
    });

    it('should the boolean value that the validator returns if it exists for fieldName', () => {
      expect(utils.validate('myAwesomeField', 'secret')).toBe(true);
      expect(utils.validate('myAwesomeField', 'not secret')).toBe(false);
    });
  });
});
