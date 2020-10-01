import COUNTRIES_LIST from 'libs/countries_list.json';

/**
 * Gets the country code for a given country name.
 * @param  {String} countryName
 * @return {String?}             Country code
 */
export function getCountryCodeFromName(countryName) {
  return COUNTRIES_LIST.find(({ name }) => name === countryName)?.code ?? null;
}
