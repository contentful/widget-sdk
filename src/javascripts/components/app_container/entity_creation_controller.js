'use strict';

angular.module('contentful')
.controller('EntityCreationController', ['require', function EntityCreationController (require) {
  var notification = require('notification');
  var logger = require('logger');
  var enforcements = require('access_control/Enforcements');
  var $state = require('$state');
  var spaceContext = require('spaceContext');

  this.newEntry = function (contentTypeId) {
    var handler = makeEntityResponseHandler({
      entityType: 'entry',
      entitySubType: contentTypeId,
      stateName: 'spaces.detail.entries.detail',
      stateParam: 'entryId',
      errorMessage: 'Could not create Entry'
    });

    spaceContext.space.createEntry(contentTypeId, {})
    .then(_.partial(handler, null), handler);
  };

  this.newAsset = function () {
    var handler = makeEntityResponseHandler({
      entityType: 'asset',
      entitySubType: function (entity) {
        return entity && entity.getId();
      },
      stateName: 'spaces.detail.assets.detail',
      stateParam: 'assetId',
      errorMessage: 'Could not create Asset'
    });
    var data = { sys: { type: 'Asset' }, fields: {} };

    spaceContext.space.createAsset(data)
    .then(_.partial(handler, null), handler);
  };

  this.newLocale = function () {
    var organization = spaceContext.organization;
    var usage = enforcements.computeUsageForOrganization(organization, 'locale');
    if (usage) {
      return notification.error(usage);
    }
    $state.go('spaces.detail.settings.locales.new');
  };

  function makeEntityResponseHandler (params) {
    return function entityResponseHandler (err, entity) {
      var stateParams = {};
      if (!err) {
        stateParams[params.stateParam] = entity.getId();
        $state.go(params.stateName, stateParams);
      } else {
        if (_.get(err, 'body.details.reasons')) {
          var enforcement = enforcements.determineEnforcement(
            spaceContext.organization,
            err.body.details.reasons,
            params.entityType
          );
          if (enforcement) {
            params.errorMessage = enforcement.tooltip || enforcement.message;
          }
        }
        logger.logServerWarn(params.errorMessage, {error: err});
        notification.error(params.errorMessage);
      }
    };
  }
}]);
