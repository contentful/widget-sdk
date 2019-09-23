import qs from 'qs';

export function getLocationHref() {
  return window.location.href;
}

export function getQueryString() {
  return qs.parse(window.location.search.substr(1));
}

export function setQueryString(params) {
  window.location.search = '?' + qs.stringify(params);
}
