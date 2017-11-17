'use strict';

/**
 * @ngdoc service
 * @name paywallOpener
 * @description
 * Opens the paywall.
 */
angular.module('contentful')
.factory('paywallOpener', ['require', function (require) {
  var $q = require('$q');
  var $sce = require('$sce');
  var lazyLoad = require('LazyLoader').get;
  var modalDialog = require('modalDialog');
  var recommendPlan = require('subscriptionPlanRecommender').recommend;
  var intercom = require('intercom');
  var Analytics = require('analytics/Analytics');
  var TheAccountView = require('TheAccountView');

  var paywallIsOpen = false;

  return {
    openPaywall: openPaywall
  };

  function openPaywall (organization, options) {
    if (paywallIsOpen) {
      return;
    }

    options = _.extend({
      offerPlanUpgrade: false
    }, options);

    track('viewed');
    paywallIsOpen = true;

    loadScopeData().then(openPaywallDialog);

    function openPaywallDialog (scopeData) {
      modalDialog.open({
        title: 'Paywall',
        template: 'paywall_dialog',
        persistOnNavigation: true,
        scopeData: scopeData
      }).promise
      .catch(function () {
        track('closed');
      })
      .finally(function () {
        paywallIsOpen = false;
      });
    }

    function loadScopeData () {
      var organizationId = _.get(organization, 'sys.id');
      var scope = {
        offerToSetUpPayment: options.offerPlanUpgrade,
        setUpPayment: newUpgradeAction(),
        openIntercom: intercom.open
      };

      if (options.offerPlanUpgrade) {
        var loadPlanCardCss = lazyLoad('gkPlanCardStyles');
        var loadPlanCard = recommendPlan(organizationId);

        return $q.all([loadPlanCardCss, loadPlanCard])
        .then(function (data) {
          return data[1];
        })
        .then(returnScopeWithPlan, resolveWithScope);
      } else {
        return resolveWithScope();
      }

      function resolveWithScope () {
        return $q.resolve(scope);
      }

      function returnScopeWithPlan (recommendation) {
        if (recommendation.reason) {
          var reasonHtml = recommendation.reason.outerHTML;
          scope.planRecommendationReasonHtml = $sce.trustAsHtml(reasonHtml);
        }
        scope.planHtml = $sce.trustAsHtml(recommendation.plan.outerHTML);
        return scope;
      }
    }

    function newUpgradeAction () {
      return function upgradeAction () {
        track('upgrade_clicked');
        TheAccountView.goToSubscription();
      };
    }

    function track (event) {
      Analytics.track('paywall:' + event, {
        userCanUpgradePlan: options.offerPlanUpgrade
      });
    }
  }
}]);
