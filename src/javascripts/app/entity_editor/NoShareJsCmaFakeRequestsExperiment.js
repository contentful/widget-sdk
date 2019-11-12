import { noop } from 'lodash';
import * as K from 'utils/kefir';
import { getVariation } from 'LaunchDarkly';
import { ENTITY_EDITOR_CMA_EXPERIMENT } from 'featureFlags';

const PATH = {
  Entry: 'entries',
  Asset: 'assets'
};

/**
 * The following weirdness is for analysing the viability of replacing ShareJS
 * with plain HTTP calls to the CMA.
 *
 * @param {Object} $scope entity editor scope. Expected to have a `otDoc` prop.
 * @param {Object} spaceContext
 * @param {Object} entityInfo Expects an `id` and `type`.
 */
export default async function create({ $scope, spaceContext, entityInfo }) {
  const variation = await getVariation(ENTITY_EDITOR_CMA_EXPERIMENT, {
    organizationId: spaceContext.getData('organization.sys.id'),
    spaceId: spaceContext.space.getId()
  });
  const isEnabled = variation !== undefined && variation > -1;
  if (isEnabled) {
    setupFakeRequests(variation);
  }

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
      spaceContext.endpoint(createRequest()).then(noop, noop);
    });
  }
}
