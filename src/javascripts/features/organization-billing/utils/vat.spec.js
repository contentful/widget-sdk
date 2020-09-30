import * as vat from './vat';

describe('vat utils', () => {
  describe('isVATUsingCountry', () => {
    it('should return true if the country uses VAT', () => {
      expect(vat.isVATUsingCountry('Germany')).toBeTruthy();
    });

    it('should return false if the country does not use VAT', () => {
      expect(vat.isVATUsingCountry('Qatar')).toBeFalsy();
    });
  });

  describe('isValidVATFormat', () => {
    it('should return true if the country does not use VAT', () => {
      expect(vat.isValidVATFormat('Qatar', 'DE275148225')).toBeTruthy();
    });

    it('should return true if the country uses VAT and the VAT number is in the correct format', () => {
      expect(vat.isValidVATFormat('Germany', 'DE275148225')).toBeTruthy();
    });

    it('should return false if the country uses VAT and the VAT number is in the incorrect format', () => {
      expect(vat.isValidVATFormat('Estonia', 'DE275148225')).toBeFalsy();
    });
  });
});
