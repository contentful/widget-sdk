import * as country from './country';

describe('country utils', () => {
  describe('getCountryCodeFromName', () => {
    it('should return a country code given a valid country name', () => {
      expect(country.getCountryCodeFromName('Estonia')).toBe('EE');
    });

    it('should return null if an invalid country name is given', () => {
      expect(country.getCountryCodeFromName('Flatland')).toBeNull();
    });
  });
});
