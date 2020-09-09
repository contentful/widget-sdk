import COUNTRIES_LIST from 'libs/countries_list.json';

export function getCountryNameFromCountryCode(countryCode) {
  const countryObject = COUNTRIES_LIST.find((country) => {
    return country.code === countryCode;
  });

  return countryObject.name;
}
