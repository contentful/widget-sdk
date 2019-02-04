import { fromPairs } from 'lodash';
import { getModule } from 'NgRegistry.es6';

export function init() {
  const logger = getModule('logger');

  const tuples = Object.entries(window.localStorage);
  const totalSize = new Blob(tuples).size;
  // map values to their respective size in bytes
  const withSizes = tuples.map(([key, value]) => [key, new Blob([key, value]).size]);

  const warningMinSize = 1e6; // that's 1MB

  // we only log it if the storage size is already too big
  if (totalSize > warningMinSize) {
    logger.logWarn('Local storage warning', {
      data: {
        rowSizes: fromPairs(withSizes),
        totalSize
      }
    });
  }
}
