/**
 * @ngdoc service
 * @name contextual_help/Store
 *
 * @description
 * This service is responsible for exposing and storing data for the sidebar.
 * It also holds shared actions.
 */
import {merge, pick} from 'lodash';
import { getStore } from 'utils/TheStore';
import * as events from 'analytics/events/ContextualHelp';


const defaultState = {
  isExpanded: false,
  isHidden: false,
  calloutSeen: false,
  introCompleted: false,
  introProgress: 1,
  introStepsRemaining: 3
};

const STORE_KEY_PREFIX = 'contextualHelp';

let contextualHelpStore = {
  state: {},
  actions: {}
};

let myBrowserStore;

export function init (userId, state, actions) {
  myBrowserStore = getStore().forKey(`${STORE_KEY_PREFIX}:${userId}`);
  contextualHelpStore = merge(
    {},
    contextualHelpStore,
    { state: defaultState },
    { state: myBrowserStore.get() || {} },
    { state },
    { actions },
    {
      actions: {
        toggle,
        minimize,
        toggleVisibility,
        dismissCallout,
        completeIntro
      }
    }
  );
}

export function get () {
  return contextualHelpStore;
}

export function checkNavigatedWhileOpen () {
  if (contextualHelpStore.state.isExpanded && !contextualHelpStore.state.isHidden) {
    events.navigateWhileOpen(!contextualHelpStore.state.introCompleted);
  }
}

export function toggle () {
  contextualHelpStore.state.isExpanded = !contextualHelpStore.state.isExpanded;
  if (!contextualHelpStore.state.calloutSeen) {
    closeCallout();
  }
  setStoreValue({
    isExpanded: contextualHelpStore.state.isExpanded
  });
  events.toggle(
    contextualHelpStore.state.isExpanded,
    !contextualHelpStore.state.introCompleted
  );
  contextualHelpStore.actions.render();
}

export function minimize () {
  contextualHelpStore.state.isExpanded = true;
  toggle();
}

export function toggleVisibility () {
  contextualHelpStore.state.isHidden = !contextualHelpStore.state.isHidden;
  setStoreValue({isHidden: contextualHelpStore.state.isHidden});
  events.toggleVisibility(contextualHelpStore.state.isHidden, !contextualHelpStore.state.introCompleted);
  contextualHelpStore.actions.render();
}

export function dismissCallout () {
  closeCallout();
  contextualHelpStore.actions.render();
}

export function continueIntro () {
  if (contextualHelpStore.state.introStepsRemaining && !contextualHelpStore.state.isHidden) {
    contextualHelpStore.state.introProgress += 1;
    contextualHelpStore.state.introStepsRemaining -= 1;
    setStoreValue({
      introProgress: contextualHelpStore.state.introProgress,
      introStepsRemaining: contextualHelpStore.state.introStepsRemaining
    });
    events.continueIntro();
    contextualHelpStore.actions.render();
  }
}

export function completeIntro () {
  if (!contextualHelpStore.state.introStepsRemaining && contextualHelpStore.state.introCompleted === false) {
    contextualHelpStore.state.introCompleted = true;
    setStoreValue({introCompleted: true});
    events.completeIntro();
  }
}

function closeCallout () {
  contextualHelpStore.state.calloutSeen = true;
  setStoreValue({calloutSeen: true});
  events.dismissCallout();
}

function setStoreValue (data) {
  myBrowserStore.set(
    merge(
      pick(
        contextualHelpStore.state,
        ['isExpanded', 'isHidden', 'calloutSeen', 'introCompleted', 'introProgress', 'introStepsRemaining']
      ),
      data
    )
  );
}
