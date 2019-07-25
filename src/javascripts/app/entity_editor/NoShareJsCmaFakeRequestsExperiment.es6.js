import { noop } from 'lodash';
import * as K from 'utils/kefir.es6';
import { getVariation } from 'LaunchDarkly.es6';
import { ENTITY_EDITOR_CMA_EXPERIMENT } from 'featureFlags.es6';

const PATH = {
  Entry: 'entries',
  Asset: 'assets'
};

/**
 * The following weirdness is for analysing the viability of replacing ShareJS
 * with plain HTTP calls to the CMA.
 */
export default function create({ $scope, organizationId, entityInfo, endpoint }) {
  let onLocalChangeOff = noop;

  getVariation(ENTITY_EDITOR_CMA_EXPERIMENT, {
    organizationId
  }).then(intervalMs => {
    onLocalChangeOff();
    const isEnabled = intervalMs !== undefined && intervalMs > -1;

    if (!isEnabled) {
      return;
    }

    const throttledChanges$ = $scope.otDoc.docLocalChanges$.throttle(intervalMs, {
      leading: false
    });
    onLocalChangeOff = K.onValueScope($scope, throttledChanges$, change => {
      if (change && change.name === 'changed') {
        endpoint(createRequest(intervalMs)).then(noop, noop);
      }
    });
  });

  function createRequest(intervalMs) {
    return {
      method: 'GET',
      // .php will result in the request being rejected so it won't count towards rate limiting.
      path: [PATH[entityInfo.type], `${entityInfo.id}.php`],
      query: {
        debounce: intervalMs
      }
    };
  }
}
