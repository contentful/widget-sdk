'use strict';

angular.module('contentful').factory('entityCreator', [
  'require',
  require => {
    const { Notification } = require('@contentful/ui-component-library');
    const logger = require('logger');
    const enforcements = require('access_control/Enforcements.es6');
    const spaceContext = require('spaceContext');
    const $q = require('$q');

    return {
      newEntry: newEntry,
      newAsset: newAsset
    };

    function newEntry(contentTypeId) {
      return spaceContext.space
        .createEntry(contentTypeId, {})
        .catch(makeEntityErrorHandler('entry'));
    }

    function newAsset() {
      const data = { sys: { type: 'Asset' }, fields: {} };
      return spaceContext.space.createAsset(data).catch(makeEntityErrorHandler('asset'));
    }

    function makeEntityErrorHandler(entityType) {
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
  }
]);
