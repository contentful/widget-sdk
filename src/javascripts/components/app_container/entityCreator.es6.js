import { getModule } from 'NgRegistry.es6';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import * as logger from 'services/logger.es6';

import * as enforcements from 'access_control/Enforcements';

export function newEntry(contentTypeId) {
  const spaceContext = getModule('spaceContext');
  return spaceContext.space.createEntry(contentTypeId, {}).catch(makeEntityErrorHandler('entry'));
}

export function newAsset() {
  const spaceContext = getModule('spaceContext');
  const data = { sys: { type: 'Asset' }, fields: {} };
  return spaceContext.space.createAsset(data).catch(makeEntityErrorHandler('asset'));
}

function makeEntityErrorHandler(entityType) {
  const $q = getModule('$q');
  const spaceContext = getModule('spaceContext');
  return err => {
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

    logger.logServerWarn(message, { error: err });
    Notification.error(message);

    return $q.reject(err);
  };
}
