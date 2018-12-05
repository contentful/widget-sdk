'use strict';

/**
 * @ngdoc service
 * @name paywallOpener
 * @description
 * Opens the paywall.
 */
angular.module('contentful').factory('paywallOpener', [
  'require',
  require => {
    var _ = require('lodash');
    var $q = require('$q');
    var $sce = require('$sce');
    var lazyLoad = require('LazyLoader').get;
    var modalDialog = require('modalDialog');
    var recommendPlan = require('subscriptionPlanRecommender').recommend;
    var intercom = require('intercom');
    var Analytics = require('analytics/Analytics.es6');
    var TheAccountView = require('TheAccountView');
    var Config = require('Config.es6');
    var $window = require('$window');

    var paywallIsOpen = false;

    return {
      openPaywall: openPaywall
    };

    function openPaywall(organization, options) {
      if (paywallIsOpen) {
        return;
      }

      options = _.extend(
        {
          offerPlanUpgrade: false
        },
        options
      );

      track('viewed');
      paywallIsOpen = true;

      loadScopeData().then(openPaywallDialog);

      function openPaywallDialog(scopeData) {
        modalDialog
          .open({
            title: 'Paywall',
            template: 'paywall_dialog',
            persistOnNavigation: true,
            scopeData: scopeData
          })
          .promise.catch(() => {
            track('closed');
          })
          .finally(() => {
            paywallIsOpen = false;
          });
      }

      function openSupport() {
        if (intercom.isEnabled()) {
          intercom.open();
        } else {
          $window.open(Config.supportUrl);
        }
      }

      function loadScopeData() {
        var organizationId = _.get(organization, 'sys.id');
        var scope = {
          offerToSetUpPayment: options.offerPlanUpgrade,
          setUpPayment: newUpgradeAction(),
          openSupport: openSupport
        };

        if (options.offerPlanUpgrade) {
          var loadPlanCardCss = lazyLoad('gkPlanCardStyles');
          var loadPlanCard = recommendPlan(organizationId);

          return $q
            .all([loadPlanCardCss, loadPlanCard])
            .then(data => data[1])
            .then(returnScopeWithPlan, resolveWithScope);
        } else {
          return resolveWithScope();
        }

        function resolveWithScope() {
          return $q.resolve(scope);
        }

        function returnScopeWithPlan(recommendation) {
          if (recommendation.reason) {
            var reasonHtml = recommendation.reason.outerHTML;
            scope.planRecommendationReasonHtml = $sce.trustAsHtml(reasonHtml);
          }
          scope.planHtml = $sce.trustAsHtml(recommendation.plan.outerHTML);
          return scope;
        }
      }

      function newUpgradeAction() {
        return function upgradeAction() {
          track('upgrade_clicked');
          TheAccountView.goToSubscription();
        };
      }

      function track(event) {
        Analytics.track('paywall:' + event, {
          userCanUpgradePlan: options.offerPlanUpgrade
        });
      }
    }
  }
]);
