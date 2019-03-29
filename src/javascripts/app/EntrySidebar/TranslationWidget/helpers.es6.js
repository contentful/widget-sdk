import { orderBy } from 'lodash';

export const orderLocales = locales =>
  orderBy(locales, ['default', 'internal_code'], ['desc', 'asc']);
