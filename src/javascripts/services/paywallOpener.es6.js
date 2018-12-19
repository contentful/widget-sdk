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
    const _ = require('lodash');
    const $q = require('$q');
    const $sce = require('$sce');
    const lazyLoad = require('LazyLoader').get;
    const modalDialog = require('modalDialog');
    const recommendPlan = require('subscriptionPlanRecommender').recommend;
    const intercom = require('intercom');
    const Analytics = require('analytics/Analytics.es6');
    const TheAccountView = require('TheAccountView');
    const Config = require('Config.es6');
    const $window = require('$window');

    let paywallIsOpen = false;

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
        const organizationId = _.get(organization, 'sys.id');
        const scope = {
          offerToSetUpPayment: options.offerPlanUpgrade,
          setUpPayment: newUpgradeAction(),
          openSupport: openSupport
        };

        if (options.offerPlanUpgrade) {
          const loadPlanCardCss = lazyLoad('gkPlanCardStyles');
          const loadPlanCard = recommendPlan(organizationId);

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
            const reasonHtml = recommendation.reason.outerHTML;
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
