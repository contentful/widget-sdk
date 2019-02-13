import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as Telemetry from 'Telemetry.es6';
import * as Intercom from 'services/intercom.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name paywallOpener
   * @description
   * Opens the paywall.
   */
  registerFactory('paywallOpener', [
    '$q',
    '$sce',
    '$window',
    'modalDialog',
    'TheAccountView',
    'Config.es6',
    'analytics/Analytics.es6',
    'subscriptionPlanRecommender',
    (
      $q,
      $sce,
      $window,
      modalDialog,
      TheAccountView,
      Config,
      Analytics,
      { recommend: recommendPlan }
    ) => {
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
          Telemetry.count('paywall');

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
          if (Intercom.isEnabled()) {
            Intercom.open();
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
            return recommendPlan(organizationId).then(returnScopeWithPlan, resolveWithScope);
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
}
