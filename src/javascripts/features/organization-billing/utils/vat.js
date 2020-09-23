import * as jsVAT from 'jsvat';

// Finds the country object from jsVAT based off the country code.
function getVatCountryObject(countryCode) {
  return jsVAT.countries.find((vatCountry) => {
    return vatCountry.codes.includes(countryCode);
  });
}

export function getIsVatCountry(countryCode) {
  return getVatCountryObject(countryCode) !== undefined;
}

// NOTE: This only checks the formatting of the VAT number based off the given country. It does not check
// if the VAT number is a real VAT number.
export function isValidVat(vatNumber, countryCode) {
  const countryObject = getVatCountryObject(countryCode);
  const jsVatResult = jsVAT.checkVAT(vatNumber, [countryObject]);

  return jsVatResult.isValid;
}
