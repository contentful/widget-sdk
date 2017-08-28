/**
 * @ngdoc service
 * @name contextual_help/Store
 *
 * @description
 * This service is responsible for exposing and storing data for the sidebar.
 * It also holds shared actions.
 */
import {merge, pick} from 'lodash';
import TheStore from 'TheStore';
import * as events from 'analytics/events/ContextualHelp';


const defaultState = {
  isExpanded: false,
  isHidden: false,
  calloutSeen: false,
  introCompleted: false,
  introProgress: 1,
  introStepsRemaining: 3,
  copied: false
};

const STORE_KEY_PREFIX = 'contextualHelp';

let ContextualHelpStore = {
  state: {},
  actions: {}
};

let myBrowserStore;

export function init (userId, state, actions) {
  myBrowserStore = TheStore.forKey(`${STORE_KEY_PREFIX}:${userId}`);
  ContextualHelpStore = merge(
    {},
    ContextualHelpStore,
    { state: defaultState },
    { state: myBrowserStore.get() || {} },
    { state },
    { actions },
    {
      actions: {
        toggle,
        minimize,
        toggleVisibility,
        dismissCallout
      }
    }
  );
}

export function get () {
  return ContextualHelpStore;
}

export function checkNavigatedWhileOpen () {
  if (ContextualHelpStore.state.isExpanded && !ContextualHelpStore.state.isHidden) {
    events.navigateWhileOpen({isIntro: !ContextualHelpStore.state.introCompleted});
  }
}

export function toggle () {
  ContextualHelpStore.state.isExpanded = !ContextualHelpStore.state.isExpanded;
  if (!ContextualHelpStore.state.calloutSeen) {
    closeCallout();
  }
  setStoreValue({
    isExpanded: ContextualHelpStore.state.isExpanded
  });
  events.toggle({isExpanded: ContextualHelpStore.state.isExpanded, isIntro: !ContextualHelpStore.state.introCompleted});
  ContextualHelpStore.actions.render();
}

export function minimize () {
  ContextualHelpStore.state.isExpanded = true;
  toggle();
}

export function toggleVisibility () {
  ContextualHelpStore.state.isHidden = !ContextualHelpStore.state.isHidden;
  setStoreValue({isHidden: ContextualHelpStore.state.isHidden});
  events.toggleVisibility({isHidden: ContextualHelpStore.state.isHidden, isIntro: !ContextualHelpStore.state.introCompleted});
  ContextualHelpStore.actions.render();
}

export function dismissCallout () {
  closeCallout();
  ContextualHelpStore.actions.render();
}

export function continueIntro () {
  if (!ContextualHelpStore.state.introCompleted && !ContextualHelpStore.state.isHidden) {
    ContextualHelpStore.state.introProgress += 1;
    ContextualHelpStore.state.introStepsRemaining -= 1;
    setStoreValue({
      introProgress: ContextualHelpStore.state.introProgress,
      introStepsRemaining: ContextualHelpStore.state.introStepsRemaining
    });
    events.continueIntro();
  }
}

export function completeIntro () {
  if (!ContextualHelpStore.state.introStepsRemaining && ContextualHelpStore.state.introCompleted === false) {
    ContextualHelpStore.state.introCompleted = true;
    setStoreValue({introCompleted: true});
    events.completeIntro();
  }
}

function closeCallout () {
  ContextualHelpStore.state.calloutSeen = true;
  setStoreValue({calloutSeen: true});
  events.dismissCallout();
}

function setStoreValue (data) {
  myBrowserStore.set(
    merge(
      pick(
        ContextualHelpStore.state,
        ['isExpanded', 'isHidden', 'calloutSeen', 'introCompleted', 'introProgress', 'introStepsRemaining']
      ),
      data
    )
  );
}
