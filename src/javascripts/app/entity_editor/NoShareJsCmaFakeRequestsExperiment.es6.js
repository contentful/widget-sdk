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
 *
 * @param {Object} $scope entity editor scope. Expected to have a `otDoc` prop.
 * @param {string} organizationId
 * @param {Object} entityInfo Expects an `id` and `type`.
 * @param {SpaceEndpoint} endpoint
 */
export default function create({ $scope, organizationId, entityInfo, endpoint }) {
  getVariation(ENTITY_EDITOR_CMA_EXPERIMENT, {
    organizationId
  }).then(variation => {
    const isEnabled = variation !== undefined && variation > -1;
    if (isEnabled) {
      setupFakeRequests(variation);
    }
  });

  function setupFakeRequests(throttleMs) {
    const createRequest = () => ({
      method: 'GET',
      // .php will result in the request being rejected so it won't count towards rate limiting.
      path: [PATH[entityInfo.type], entityInfo.id, 'edit.php'],
      query: { throttle: throttleMs }
    });

    const throttledRelevantChanges$ = $scope.otDoc.docLocalChanges$
      .filter(change => change && change.name === 'changed')
      .throttle(throttleMs, { leading: false });

    K.onValueScope($scope, throttledRelevantChanges$, () => {
      endpoint(createRequest()).then(noop, noop);
    });
  }
}
