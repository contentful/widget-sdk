'use strict';

/**
 * @ngdoc service
 * @name billingNotifier
 */
angular.module('contentful')
.factory('billingNotifier', ['require', function (require) {

  var $rootScope = require('$rootScope');
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

  return {
  /**
   * @ngdoc method
   * @name billingNotifier#notifyAbout
   * @param {Object} organization
   * @description
   * Sets/updates the notifier's context and will trigger the appropriate
   * notifications.
   */
    notifyAbout: notifyAbout
  };

  function notifyAbout (organization) {
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
