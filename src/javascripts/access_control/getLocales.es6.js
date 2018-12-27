import { sortBy, flow, map } from 'lodash/fp';

import { getModule } from 'NgRegistry.es6';

const CONFIG = getModule('PolicyBuilder/CONFIG');
const TheLocaleStore = getModule('TheLocaleStore');

export default () =>
  [{ code: CONFIG.ALL_LOCALES, name: 'All locales' }].concat(
    flow(
      map(({ code, name }) => ({ code, name: `${name} (${code})` })),
      sortBy('name')
    )(TheLocaleStore.getPrivateLocales())
  );
