'use strict';

angular.module('contentful')
.factory('entityCreator', ['require', require => {
  var notification = require('notification');
  var logger = require('logger');
  var enforcements = require('access_control/Enforcements');
  var spaceContext = require('spaceContext');
  var $q = require('$q');

  return {
    newEntry: newEntry,
    newAsset: newAsset
  };

  function newEntry (contentTypeId) {
    return spaceContext.space.createEntry(contentTypeId, {})
    .catch(makeEntityErrorHandler('entry'));
  }

  function newAsset () {
    var data = { sys: { type: 'Asset' }, fields: {} };
    return spaceContext.space.createAsset(data)
    .catch(makeEntityErrorHandler('asset'));
  }

  function makeEntityErrorHandler (entityType) {
    return err => {
      var message = 'Could not create ' + entityType;

      if (_.get(err, 'body.details.reasons')) {
        var enforcement = enforcements.determineEnforcement(
          spaceContext.organization,
          err.body.details.reasons,
          entityType
        );
        if (enforcement) {
          message = enforcement.tooltip || enforcement.message;
        }
      }

      logger.logServerWarn(message, {error: err});
      notification.error(message);

      return $q.reject(err);
    };
  }
}]);
