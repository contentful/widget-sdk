import { useState } from 'react';
import { pick, isEmpty } from 'lodash';
import qs from 'qs';

function getLocation() {
  return pick(window.location, [
    'hash',
    'host',
    'hostname',
    'href',
    'origin',
    'pathname',
    'port',
    'protocol',
    'search',
  ]);
}

const getInitialSearchValue = () => {
  return window.location.search;
};

/**
 * @deprecated use only to make query params work with Angular UI router
 */
export function useLegacyQueryParams() {
  const [searchQuery, setSearchQuery] = useState(getInitialSearchValue);

  const updateSearchQuery = (search: any) => {
    const location = getLocation();
    const query = !isEmpty(search) ? `?${qs.stringify(search)}` : '';
    window.history.replaceState({}, '', `${location.pathname}${query}`);
    setSearchQuery(query);
  };

  return { searchQuery, updateSearchQuery };
}
