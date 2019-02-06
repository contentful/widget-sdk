import { sortBy, flow, map } from 'lodash/fp';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder/index.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

export default () =>
  [{ code: PolicyBuilderConfig.ALL_LOCALES, name: 'All locales' }].concat(
    flow(
      map(({ code, name }) => ({ code, name: `${name} (${code})` })),
      sortBy('name')
    )(TheLocaleStore.getPrivateLocales())
  );
