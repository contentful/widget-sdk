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
 * $injector.get('navigation/stateChangeHandlers').setup()
 */
.factory('navigation/stateChangeHandlers', ['$injector', function ($injector) {
  var $rootScope     = $injector.get('$rootScope');
  var $document      = $injector.get('$document');
  var $state         = $injector.get('$state');
  var spaceTools     = $injector.get('spaceTools');
  var contextHistory = $injector.get('contextHistory');
  var logger         = $injector.get('logger');
  var modalDialog    = $injector.get('modalDialog');

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
    $rootScope.$watch(function () {
      return $state.current.ncyBreadcrumbLabel;
    }, function (label) {
      $document[0].title = label || 'Contentful';
    });

    $rootScope.$on('$stateChangeStart', stateChangeStartHandler);
    $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
    $rootScope.$on('$stateNotFound', stateChangeErrorHandler);
  }

  function stateChangeStartHandler(event, toState, toStateParams, fromState, fromStateParams) {
    var hasRedirected = redirect(event, toState, toStateParams);

    if (hasRedirected) {
      return;
    }

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
      $state.go(toState.redirectTo, toStateParams);
    }
  }

  function redirect (event, toState, toStateParams) {
    if (
      _.includes(['otherwise', 'spaces'], toState.name) ||
      (toState.name === 'spaces.detail' && _.isEmpty(toStateParams.spaceId))
    ) {
      event.preventDefault();
      spaceTools.goToInitialSpace();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Switches to the first space's entry list if there is a navigation error
   */
  function stateChangeErrorHandler(event, toState, toParams, fromState, fromParams, error) {
    event.preventDefault();

    var matchedSection = /spaces.detail.(entries|assets|content_types|api\.keys).detail/.exec(toState.name);
    if (matchedSection && error.statusCode == 404) {
      // If a request for an entity returns a 404 error we just go to the
      // list for that entity.
      // TODO we should provide some feedback to the user
      $state.go('spaces.detail.'+matchedSection[1]+'.list', { spaceId: toParams.spaceId });
    } else {
      spaceTools.goToInitialSpace();
      // Otherwise we redirect the user to the inital space
      // TODO We should notify the user of what happened and maybe
      // rethrow the exception. As a temporary measure we log the error
      // to figure out what errors are actually thrown.
      logRoutingError(
        error,
        { state: toState, params: toParams },
        { state: fromState, params: fromParams }
      );
    }
  }

  function logRoutingError (error, from, to) {
    var metaData = {
      error: error,
      data: {
        toState: {
          name: dotty.get(to, 'state.name'),
          params: dotty.get(to, 'params')
        },
        fromState: {
          name: dotty.get(from, 'state.name'),
          params: dotty.get(from, 'params')
        }
      }
    };

    // $http requests may return rejections that are *not* instances of
    // 'Error'. We record them separately
    // property.
    if (error.statusCode) {
      logger.logServerError('error during routing', metaData);
    } else {
      metaData.groupingHash = 'routing-error';
      logger.logException(error, metaData);
    }
  }

  /**
   * Compares a state transition and returns true if everything except
   * the `addToContext` property of the parameters stays the same.
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
