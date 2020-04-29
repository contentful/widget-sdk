import { sortBy, flow, map } from 'lodash/fp';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder';

export const getLocales = (privateLocales) =>
  [{ code: PolicyBuilderConfig.ALL_LOCALES, name: 'All locales' }].concat(
    flow(
      map(({ code, name }) => ({ code, name: `${name} (${code})` })),
      sortBy('name')
    )(privateLocales)
  );
