import * as jsVAT from 'jsvat';
import COUNTRIES_LIST from 'libs/countries_list.json';

/**
 * Gets the country code for a given country name.
 * @param  {String} countryName
 * @return {String?}             Country code
 */
function getCountryCodeFromName(countryName) {
  return COUNTRIES_LIST.find(({ name }) => name === countryName)?.code;
}

/**
 * Gets the jsVAT country object from the country name
 * @param  {String} countryName The country name (e.g. United States)
 * @return {Object?}
 */
function getVatCountryObject(countryName) {
  const countryCode = getCountryCodeFromName(countryName);

  return jsVAT.countries.find((vatCountry) => vatCountry.codes.includes(countryCode)) ?? null;
}

/**
 * Returns if the country given uses VAT, according to jsVAT.
 *
 * @param  {String} countryName
 * @return {Boolean}
 */
export function isCountryUsingVAT(countryName) {
  return !!getVatCountryObject(countryName);
}

/**
 * Determines if the VAT given is of the correct format for a given country.
 * @param  {String}  countryName
 * @param  {String}  vatNumber
 * @return {Boolean}
 */
export function isValidVATFormat(countryName, vatNumber) {
  const countryObject = getVatCountryObject(countryName);

  // If the given country name is not one that is in jsVAT, then by definition
  // it is valid as it doesn't require VAT.
  if (!countryObject) {
    return true;
  }

  const jsVatResult = jsVAT.checkVAT(vatNumber, [countryObject]);

  return jsVatResult.isValid;
}
