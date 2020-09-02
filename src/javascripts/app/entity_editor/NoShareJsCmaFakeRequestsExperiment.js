import { noop } from 'lodash';
import * as K from 'core/utils/kefir';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { localFieldChanges } from './Document';

const PATH = {
  Entry: 'entries',
  Asset: 'assets',
};

/**
 * The following weirdness is for analysing the viability of replacing ShareJS
 * with plain HTTP calls to the CMA.
 *
 * @param {Object} otDoc
 * @param {Object} spaceContext
 * @param {Object} entityInfo Expects an `id` and `type`.
 */
export default async function create({ doc, spaceContext, entityInfo }) {
  const variation = await getVariation(FLAGS.ENTITY_EDITOR_CMA_EXPERIMENT, {
    organizationId: spaceContext.getData('organization.sys.id'),
    spaceId: spaceContext.space.getId(),
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
      query: {
        user: spaceContext.user.sys.id,
        throttle: throttleMs,
      },
    });

    const throttledRelevantChanges$ = localFieldChanges(doc).throttle(throttleMs, {
      leading: false,
    });

    K.onValue(throttledRelevantChanges$, () => {
      spaceContext.endpoint(createRequest()).then(noop, noop);
    });
  }
}
