import React, { useState, useCallback, useEffect } from 'react';
import { pick, isEmpty } from 'lodash';
import qs from 'qs';
import { getModule } from 'core/NgRegistry';

export const LocationStateContext = React.createContext(getLocation());
export const LocationDispatchContext = React.createContext();

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

export const LocationProvider = ({ children }) => {
  const [locationValue, setLocationValue] = useState(getLocation());

  const updateLocation = useCallback((newQuery) => {
    const location = getLocation();
    const query = !isEmpty(newQuery) ? `?${qs.stringify(newQuery)}` : '';
    setLocationValue({ ...location, search: query });
    window.history.pushState({}, '', `${location.pathname}${query}`);
  }, []);

  useEffect(() => {
    const rootScope = getModule('$rootScope');
    return rootScope.$on('$locationChangeSuccess', () => {
      // need to set provider value when navigating through history
      setLocationValue(getLocation());
    });
  }, []);

  return (
    <LocationStateContext.Provider value={locationValue}>
      <LocationDispatchContext.Provider value={updateLocation}>
        {children}
      </LocationDispatchContext.Provider>
    </LocationStateContext.Provider>
  );
};
