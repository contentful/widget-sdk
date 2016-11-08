'use strict';

angular.module('contentful')
.controller('EntityCreationController', ['require', function EntityCreationController (require) {
  var analytics = require('analytics');
  var notification = require('notification');
  var logger = require('logger');
  var enforcements = require('enforcements');
  var $state = require('$state');
  var spaceContext = require('spaceContext');

  var EVENT_NAME = 'Selected Add-Button in the Frame';

  this.newEntry = function (contentType) {
    var handler = makeEntityResponseHandler({
      entityType: 'entry',
      entitySubType: contentType.getId(),
      stateName: 'spaces.detail.entries.detail',
      stateParam: 'entryId',
      errorMessage: 'Could not create Entry'
    });

    spaceContext.space.createEntry(contentType.getId(), {})
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

  this.newContentType = function () {
    $state.go('spaces.detail.content_types.new.home');
  };

  this.newApiKey = function () {
    var usage = enforcements.computeUsage('apiKey');
    if (usage) {
      return notification.error(usage);
    }
    $state.go('spaces.detail.api.keys.new');
    analytics.track(EVENT_NAME, {
      currentState: $state.current.name,
      entityType: 'apiKey'
    });
  };

  this.newLocale = function () {
    var usage = enforcements.computeUsage('locale');
    if (usage) {
      return notification.error(usage);
    }
    $state.go('spaces.detail.settings.locales.new');
    analytics.track(EVENT_NAME, {
      currentState: $state.current.name,
      entityType: 'locale'
    });
  };

  function makeEntityResponseHandler (params) {
    return function entityResponseHandler (err, entity) {
      var stateParams = {};
      if (!err) {
        stateParams[params.stateParam] = entity.getId();
        $state.go(params.stateName, stateParams);
      } else {
        if (dotty.get(err, 'body.details.reasons')) {
          var enforcement = enforcements.determineEnforcement(
            err.body.details.reasons, params.entityType);
          if (enforcement) {
            params.errorMessage = enforcement.tooltip || enforcement.message;
          }
        }
        logger.logServerWarn(params.errorMessage, {error: err});
        notification.error(params.errorMessage);
      }
      analytics.track(EVENT_NAME, {
        currentState: $state.current.name,
        entityType: params.entityType,
        entitySubType: (typeof params.entitySubType === 'function')
          ? params.entitySubType(entity)
          : params.entitySubType
      });
    };
  }

}]);
