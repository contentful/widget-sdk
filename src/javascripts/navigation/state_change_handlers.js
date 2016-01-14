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

  // Result of confirmation dialog
  var navigationConfirmed = false;

  return {
    setup: setupHandlers
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

    // TODO Should not be a scope method
    $rootScope.closeState = closeState;
  }

  function goToEntityState(entity) {
    if (entity.getType() === 'Entry') {
      $state.go('spaces.detail.entries.detail', {
        entryId: entity.getId(), addToContext: true
      });
    } else if (entity.getType() === 'Asset') {
      $state.go('spaces.detail.assets.detail', {
        assetId: entity.getId(), addToContext: true
      });
    }
  }

  function closeState() {
    var currentState = $state.$current;

    navigationConfirmed = true;
    contextHistory.pop();
    if (!contextHistory.isEmpty()) {
      goToEntityState(contextHistory.getLast());
    } else {
      $state.go((currentState.ncyBreadcrumb && currentState.ncyBreadcrumb.parent) || '');
    }
  }

  function stateChangeStartHandler(event, toState, toStateParams, fromState, fromStateParams) {
    if (fromState.name === toState.name &&
        getAddToContext(fromStateParams) === getAddToContext(toStateParams)) {
      event.preventDefault();
      return;
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
      requestLeaveConfirmation().then(function (confirmed) {
        if (confirmed) {
          navigationConfirmed = true;
          $state.go(toState.name, toStateParams);
        }
      });
      return;
    }

    preprocessStateChange(event, toState, toStateParams);
  }

  function preprocessStateChange(event, toState, toStateParams) {
    if (!toStateParams.addToContext) {
      contextHistory.purge();
    }

    // Some redirects away from nonexistent pages
    if (toState.name === 'spaces.detail') {
      event.preventDefault();
      if (_.isEmpty(toStateParams.spaceId)) {
        spaceTools.goToInitialSpace();
      } else {
        $state.go('spaces.detail.entries.list', toStateParams);
      }
    }

    if (toState.name === 'otherwise' || toState.name === 'spaces') {
      event.preventDefault();
      spaceTools.goToInitialSpace();
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

  function getAddToContext(params) {
    return JSON.stringify(_.omit(params, 'addToContext'));
  }
}]);
