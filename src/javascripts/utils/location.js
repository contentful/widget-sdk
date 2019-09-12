import qs from 'qs';

export function getQueryString() {
  return qs.parse(window.location.search.substr(1));
}
