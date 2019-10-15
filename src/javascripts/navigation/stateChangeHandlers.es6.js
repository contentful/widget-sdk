import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as logger from 'services/logger.es6';
import * as AppPerformanceMetrics from 'i13n/AppPerformance/index.es6';

import * as NavState from 'navigation/NavState.es6';
import * as Analytics from 'analytics/Analytics.es6';

export default function register() {
  /**
   * @ngdoc service
   * @module cf.app
   * @name navigation/stateChangeHandlers
   * @description
   * Add listeners to state change events that handle redirections,
   * navigation context and exit confirmations.
   *
   * @usage[js]
   * require('navigation/stateChangeHandlers').setup()
   */
  registerFactory('navigation/stateChangeHandlers', [
    '$rootScope',
    '$state',
    '$location',
    'spaceContext',
    'modalDialog',
    ($rootScope, $state, $location, spaceContext, modalDialog) => {
      const { updateNavState } = NavState;

      // Result of confirmation dialog
      let navigationConfirmed = false;

      // True when we are showing a confirmation dialog.
      // Used for detecting inconsistent state changes.
      let confirmationInProgress = false;

      return {
        setup: setupHandlers,
        setNavigationConfirmed: function(isConfirmed) {
          navigationConfirmed = isConfirmed;
        }
      };

      function setupHandlers() {
        $rootScope.$on('$stateChangeSuccess', stateChangeSuccessHandler);
        $rootScope.$on('$stateChangeStart', stateChangeStartHandler);
        $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
        $rootScope.$on('$stateNotFound', stateChangeErrorHandler);

        const unlistenStateChange = $rootScope.$on('$stateChangeSuccess', (_e, toState) => {
          AppPerformanceMetrics.track({
            stateName: toState.name
          });
          unlistenStateChange();
        });
      }

      function stateChangeSuccessHandler(
        _event,
        toState,
        toStateParams,
        fromState,
        fromStateParams
      ) {
        updateNavState(toState, toStateParams, spaceContext);

        logger.leaveBreadcrumb('Enter state', {
          state: toState && toState.name,
          // This is the limit for breadcrumb values
          location: $location.path().substr(0, 140)
        });

        // we do it here instead of "onExit" hook in "spaces" state
        // using the latter caused problems when redirecting with
        // ui-router's option {reload: true}
        if (toState.name.slice(0, 7) !== 'spaces.') {
          // This will remove the space from the current analytics session, but will
          // preserve the organziation. This means that the org will remain the same
          // and will be used in analytics calls, but the same will not be.
          //
          // See states/account_organizations.js#organizationBase for the usage of
          // setting organization when on an organization settings page, and
          // states/Spaces.es6.js#spaceDetail for the usage of setting space and org
          // when in a space page.
          Analytics.trackContextChange(null);
          spaceContext.purge();
        }

        Analytics.trackStateChange(toState, toStateParams, fromState, fromStateParams);
      }

      function stateChangeStartHandler(event, toState, toStateParams, fromState, fromStateParams) {
        if (onlyAddToContextParamChanged(toState, toStateParams, fromState, fromStateParams)) {
          event.preventDefault();
          return;
        }

        // When transitioning between two states declaring they don't care
        // about leaving confirmation...
        if (fromStateParams.ignoreLeaveConfirmation && toStateParams.ignoreLeaveConfirmation) {
          // Keep their data in sync so for example dirty state of one
          // is propagated to the other one so it can be used when finally
          // navigating to a state not requiring confirmation.
          toState.data = fromState.data || {};

          // Don't run confirmation logic below but still allow to transition
          // by not calling `preventDefault()`.
          return;
        }

        if (confirmationInProgress) {
          logger.logError('Change state during state change confirmation', {
            state: {
              from: fromState.name,
              to: toState.name
            }
          });
        }

        // Decide if it is OK to do the transition (unsaved changes etc)
        const stateData = fromState.data || {};
        const requestLeaveConfirmation = stateData.requestLeaveConfirmation;
        const needConfirmation =
          !navigationConfirmed && stateData.dirty && requestLeaveConfirmation;
        navigationConfirmed = false;
        if (needConfirmation) {
          event.preventDefault();
          confirmationInProgress = true;
          requestLeaveConfirmation().then(
            confirmed => {
              confirmationInProgress = false;
              if (confirmed) {
                navigationConfirmed = true;
                $state.go(toState.name, toStateParams);
              }
            },
            () => {
              confirmationInProgress = false;
            }
          );
          return;
        }

        // Close all modals which have persistOnNavigation = false
        modalDialog.closeAll();

        if (!toStateParams.addToContext) {
          contextHistory.purge();
        }

        // Redirect if redirectTo is set
        if (toState.redirectTo) {
          event.preventDefault();
          $state.go(toState.redirectTo, toStateParams, {
            relative: toState
          });
        }
      }

      /**
       * Switches to the first space's entry list if there is a navigation error
       */
      function stateChangeErrorHandler(event, toState, toParams, fromState, fromParams, error) {
        event.preventDefault();

        const matchedSection = /spaces.detail.(entries|assets|content_types|api\.keys).detail/.exec(
          toState.name
        );
        if (matchedSection && error.statusCode === 404) {
          // If a request for an entity returns a 404 error we just go to the
          // list for that entity.
          // TODO we should provide some feedback to the user
          $state.go('spaces.detail.' + matchedSection[1] + '.list', { spaceId: toParams.spaceId });
        } else {
          // Otherwise we redirect the user to the homepage
          // TODO We should notify the user of what happened and maybe
          // rethrow the exception. As a temporary measure we log the error
          // to figure out what errors are actually thrown.
          $state.go('error');
          logRoutingError(
            event,
            error,
            { state: toState, params: toParams },
            { state: fromState, params: fromParams }
          );
        }
      }

      function logRoutingError(event, error, from, to) {
        const metaData = {
          error: error,
          event: {
            name: event.name
          },
          data: {
            toState: {
              name: _.get(to, 'state.name'),
              params: _.get(to, 'params')
            },
            fromState: {
              name: _.get(from, 'state.name'),
              params: _.get(from, 'params')
            }
          }
        };

        if (error && error.statusCode) {
          // $http requests may return rejections that are *not* instances of
          // 'Error'. We record them separately
          // property.
          logger.logServerError('error during routing', metaData);
        } else if (error) {
          metaData.groupingHash = 'routing-event';
          logger.logException(error, metaData);
        } else {
          // Error might not be defined for $stateNotFound events
          logger.logError('State change error', metaData);
        }
      }

      /**
       * Compares a state transition and returns true if everything except
       * the `addToContext` property of the parameters stays the same.
       *
       * The `addToContext` parameter controls _how_ we transition, not
       * where we transition to.
       */
      function onlyAddToContextParamChanged(to, toParams, from, fromParams) {
        return (
          to.name === from.name &&
          'addToContext' in toParams &&
          'addToContext' in fromParams &&
          _.isEqual(_.omit(toParams, ['addToContext']), _.omit(fromParams, ['addToContext']))
        );
      }
    }
  ]);
}