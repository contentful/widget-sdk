'use strict';

angular.module('contentful')
.factory('billingNotificationsController', ['require', function (require) {

  var $rootScope = require('$rootScope');
  var spaceContext = require('spaceContext');
  var OrganizationList = require('OrganizationList');
  var TheAccountView = require('TheAccountView');

  var PAYMENT_METHOD_CREDIT_CARD = 'CreditCard';
  var NOTIFICATIONS = {
    EXPIRED_CC: {
      actionMessage: 'Update credit card',
      message: '<strong>Your credit card ending in <%- digits %> ' +
        'has expired.</strong> Please update it to continue using Contentful ' +
        'without interruptions.',
      messageParams: function (paymentMethod) {
        return {
          digits: paymentMethod.displayNumber.substr(-4)
        };
      },
      action: function () {
        TheAccountView.goToBilling();
      }
    }
  };

  var lastSpaceId = spaceContext.getId();

  return {
    init: init
  };

  function init () {
    $rootScope.$watchCollection(function () {
      return {
        spaceId: spaceContext.getId(),
        isInitialized: !OrganizationList.isEmpty()
      };
    }, watcher);
  }

  function watcher (args) {
    if (!args.spaceId || !args.isInitialized || args.spaceId === lastSpaceId) {
      return;
    }

    lastSpaceId = args.spaceId;
    var organization = spaceContext.getData('organization') || {};

    if (!userOwnsOrganization(organization)) {
      return;
    }

    var expiredPaymentMethod = organization.zExpiredPaymentMethod;
    if (expiredPaymentMethod) {
      handleExpiredPaymentMethod(expiredPaymentMethod);
    }
  }

  function handleExpiredPaymentMethod (expiredPaymentMethod) {
    if (expiredPaymentMethod.type === PAYMENT_METHOD_CREDIT_CARD) {
      notify(NOTIFICATIONS.EXPIRED_CC, expiredPaymentMethod);
    }
  }

  function notify (messageDefinition, paymentMethod) {
    var msgTemplate = _.template(messageDefinition.message);
    var msgParams = messageDefinition.messageParams(paymentMethod);
    var msg = msgTemplate(msgParams);
    var params = _.assign(
      {message: msg},
      _.pick(messageDefinition, 'action', 'actionMessage')
    );
    $rootScope.$broadcast('persistentNotification', params);
  }

  function userOwnsOrganization (organization) {
    var orgId = dotty.get(organization, 'sys.id');
    return OrganizationList.isOwner(orgId);
  }
}]);
