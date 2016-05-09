'use strict';

/**
 * @ngdoc service
 * @name modalDialog
 * @description
 * Opens the paywall.
 */
angular.module('contentful')
.factory('paywallOpener', ['$injector', function ($injector) {

  var $q               = $injector.get('$q');
  var $sce             = $injector.get('$sce');
  var lazyLoad         = $injector.get('LazyLoader').get;
  var modalDialog      = $injector.get('modalDialog');
  var recommendPlan    = $injector.get('subscriptionPlanRecommender').recommend;
  var intercom         = $injector.get('intercom');
  var analytics        = $injector.get('analytics');
  var TheAccountView   = $injector.get('TheAccountView');

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

    trackPaywall('Viewed Paywall');
    paywallIsOpen = true;

    loadScopeData().then(openPaywallDialog);

    function openPaywallDialog (scopeData) {
      modalDialog.open({
        title: 'Paywall', // For generic Modal Dialog tracking.
        template: 'paywall_dialog',
        persistOnNavigation: true,
        scopeData: scopeData
      }).promise
      .catch(function () {
        trackPaywall('Cancelled Paywall');
      })
      .finally(function () {
        paywallIsOpen = false;
      });
    }

    function loadScopeData () {
      var organizationId = dotty.get(organization, 'sys.id');
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

    function trackPaywall (event) {
      analytics.track(event, {
        userCanUpgradePlan: options.offerPlanUpgrade,
        organizationName: organization.name
      });
    }

    function newUpgradeAction () {
      return function upgradeAction() {
        trackPaywall('Clicked Paywall Plan Upgrade Button');
        TheAccountView.goToSubscription();
      };
    }
  }

}]);
