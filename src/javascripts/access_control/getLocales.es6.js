import { sortBy, flow, map } from 'lodash/fp';

import { getModules } from 'NgRegistry.es6';

const [CONFIG, TheLocaleStore] = getModules('PolicyBuilder/CONFIG', 'TheLocaleStore');

export default () =>
  [{ code: CONFIG.ALL_LOCALES, name: 'All locales' }].concat(
    flow(
      map(({ code, name }) => ({ code, name: `${name} (${code})` })),
      sortBy('name')
    )(TheLocaleStore.getPrivateLocales())
  );
