import { getSpaceContext } from 'classes/spaceContext';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { getSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';

import * as enforcements from 'access_control/Enforcements';

export function newEntry(contentTypeId) {
  return getSpaceEnvCMAClient()
    .entry.create({ contentTypeId }, {})
    .catch(makeEntityErrorHandler('entry'));
}

export function newAsset() {
  const data = { sys: { type: 'Asset' }, fields: {} };
  return getSpaceEnvCMAClient().asset.create({}, data).catch(makeEntityErrorHandler('asset'));
}

function makeEntityErrorHandler(entityType) {
  const spaceContext = getSpaceContext();

  return (err) => {
    let message = 'Could not create ' + entityType;

    if (_.get(err, 'body.details.reasons')) {
      const enforcement = enforcements.determineEnforcement(
        spaceContext.space,
        err.body.details.reasons,
        entityType
      );
      if (enforcement) {
        message = enforcement.tooltip || enforcement.message;
      }
    }

    Notification.error(message);

    throw err;
  };
}
