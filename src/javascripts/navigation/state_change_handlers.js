'use strict';

angular.module('cf.app')

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
.factory('navigation/stateChangeHandlers', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var $state = require('$state');
  var contextHistory = require('contextHistory');
  var logger = require('logger');
  var modalDialog = require('modalDialog');
  var Analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  var $location = require('$location');
  var updateNavState = require('navigation/NavState').updateNavState;
  var _ = require('lodash');

  // Result of confirmation dialog
  var navigationConfirmed = false;

  // True when we are showing a confirmation dialog.
  // Used for detecting inconsistent state changes.
  var confirmationInProgress = false;

  return {
    setup: setupHandlers,
    setNavigationConfirmed: function (isConfirmed) { navigationConfirmed = isConfirmed; }
  };

  function setupHandlers () {
    $rootScope.$on('$stateChangeSuccess', stateChangeSuccessHandler);
    $rootScope.$on('$stateChangeStart', stateChangeStartHandler);
    $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
    $rootScope.$on('$stateNotFound', stateChangeErrorHandler);
  }

  function stateChangeSuccessHandler (_event, toState, toStateParams, fromState, fromStateParams) {
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
      Analytics.trackSpaceChange(null);
      spaceContext.purge();
    }

    Analytics.trackStateChange(toState, toStateParams, fromState, fromStateParams);
  }

  function stateChangeStartHandler (event, toState, toStateParams, fromState, fromStateParams) {
    if (onlyAddToContextParamChanged(toState, toStateParams, fromState, fromStateParams)) {
      event.preventDefault();
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
    var stateData = fromState.data || {};
    var requestLeaveConfirmation = stateData.requestLeaveConfirmation;
    var needConfirmation = !navigationConfirmed &&
                           stateData.dirty &&
                           requestLeaveConfirmation;
    navigationConfirmed = false;
    if (needConfirmation) {
      event.preventDefault();
      confirmationInProgress = true;
      requestLeaveConfirmation().then(function (confirmed) {
        confirmationInProgress = false;
        if (confirmed) {
          navigationConfirmed = true;
          $state.go(toState.name, toStateParams);
        }
      }, function () {
        confirmationInProgress = false;
      });
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
  function stateChangeErrorHandler (event, toState, toParams, fromState, fromParams, error) {
    event.preventDefault();

    var matchedSection = /spaces.detail.(entries|assets|content_types|api\.keys).detail/.exec(toState.name);
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
        event, error,
        { state: toState, params: toParams },
        { state: fromState, params: fromParams }
      );
    }
  }

  function logRoutingError (event, error, from, to) {
    var metaData = {
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
  function onlyAddToContextParamChanged (to, toParams, from, fromParams) {
    return to.name === from.name &&
           ('addToContext' in toParams) && ('addToContext' in fromParams) &&
           _.isEqual(
             _.omit(toParams, ['addToContext']),
             _.omit(fromParams, ['addToContext'])
           );
  }
}]);
