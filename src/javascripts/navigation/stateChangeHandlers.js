import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import { captureError } from 'core/monitoring';
import * as AppPerformanceMetrics from 'i13n/AppPerformance';
import { getSpaceContext } from 'classes/spaceContext';

import { updateNavState } from 'navigation/NavState';
import * as Analytics from 'analytics/Analytics';

/**
 * Add listeners to state change events that handle redirections,
 * navigation context and exit confirmations.
 */

// Result of confirmation dialog
let navigationConfirmed = false;

// True when we are showing a confirmation dialog.
// Used for detecting inconsistent state changes.
let confirmationInProgress = false;

export function setupStateChangeHandlers() {
  const $rootScope = getModule('$rootScope');

  $rootScope.$on('$stateChangeSuccess', stateChangeSuccessHandler);
  $rootScope.$on('$stateChangeStart', stateChangeStartHandler);
  $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
  $rootScope.$on('$stateNotFound', stateChangeErrorHandler);

  const unlistenStateChange = $rootScope.$on('$stateChangeSuccess', (_e, toState) => {
    AppPerformanceMetrics.track({
      stateName: toState.name,
    });
    unlistenStateChange();
  });
}

function stateChangeSuccessHandler(_event, toState, toStateParams, fromState, fromStateParams) {
  const spaceContext = getSpaceContext();

  updateNavState(toState, toStateParams, spaceContext);

  // we do it here instead of "onExit" hook in "spaces" state
  // using the latter caused problems when redirecting with
  // ui-router's option {reload: true}
  if (toState.name.slice(0, 7) !== 'spaces.') {
    // This will remove the space from the current analytics session, but will
    // preserve the organization. This means that the org will remain the same
    // and will be used in analytics calls, but the same will not be.
    //
    // See states/account_organizations.js#organizationBase for the usage of
    // setting organization when on an organization settings page, and
    // states/Spaces.js#spaceDetail for the usage of setting space and org
    // when in a space page.
    Analytics.trackContextChange({ space: null, environment: null });
    spaceContext.purge();
  }

  Analytics.trackStateChange(toState, toStateParams, fromState, fromStateParams);
}

function stateChangeStartHandler(event, toState, toStateParams, fromState, fromStateParams) {
  const $state = getModule('$state');

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
    captureError(new Error('Change state during state change confirmation'), {
      extra: {
        from: fromState.name,
        to: toState.name,
      },
    });
  }

  // Decide if it is OK to do the transition (unsaved changes etc)
  const stateData = fromState.data || {};
  const requestLeaveConfirmation = stateData.requestLeaveConfirmation;
  const needConfirmation = !navigationConfirmed && stateData.dirty && requestLeaveConfirmation;
  navigationConfirmed = false;
  if (needConfirmation) {
    event.preventDefault();
    confirmationInProgress = true;
    requestLeaveConfirmation().then(
      (confirmed) => {
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

  // Redirect if redirectTo is set
  if (toState.redirectTo) {
    event.preventDefault();
    $state.go(toState.redirectTo, toStateParams, {
      relative: toState,
    });
  }
}

/**
 * Switches to the first space's entry list if there is a navigation error
 */
function stateChangeErrorHandler(event, toState, toParams, _fromState, _fromParams, error) {
  event.preventDefault();

  const $state = getModule('$state');

  const matchedSection = /spaces.detail.(entries|assets|content_types|api\.keys).detail/.exec(
    toState.name
  );
  if (matchedSection && error.statusCode === 404) {
    // If a request for an entity returns a 404 error we just go to the
    // list for that entity.
    // TODO we should provide some feedback to the user
    $state.go('spaces.detail.' + matchedSection[1] + '.list', { spaceId: toParams.spaceId });
  } else {
    if (event?.name === '$stateNotFound') {
      captureError(new Error('Navigation to a state that does not exist'), {
        extra: {
          toState,
          toParams,
          _fromParams,
          _fromState,
        },
      });
    }
    // Otherwise we redirect the user to the homepage
    $state.go('error');
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
