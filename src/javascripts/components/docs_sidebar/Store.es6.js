/**
 * @ngdoc service
 * @name docs_sidebar/Store
 *
 * @description
 * This service is responsible for exposing and storing data for the sidebar.
 */
import {merge, pick} from 'lodash';
import TheStore from 'TheStore';
import * as events from 'analytics/events/DocsSidebar';


const defaultState = {
  isExpanded: false,
  isHidden: false,
  calloutSeen: false,
  introCompleted: false,
  introProgress: 1,
  introStepsRemaining: 3,
  copied: false
};

const STORE_KEY_PREFIX = 'contextualSidebar';

let ContextualSidebarStore = {
  state: defaultState,
  actions: {}
};

let myBrowserStore;

export function init (userId, state, actions) {
  myBrowserStore = TheStore.forKey(`${STORE_KEY_PREFIX}:${userId}`);
  ContextualSidebarStore = merge(
    ContextualSidebarStore,
    { state: myBrowserStore.get() },
    { state },
    { actions },
    {
      actions: {
        toggle,
        hide,
        toggleVisibility,
        dismissCallout
      }
    }
  );
  console.log('Initial state:', ContextualSidebarStore)
}

export function get () {
  return ContextualSidebarStore;
}

export function checkNavigatedWhileOpen () {
  if (ContextualSidebarStore.state.isExpanded && !ContextualSidebarStore.state.isHidden) {
    events.navigateWhileOpen({isIntro: !ContextualSidebarStore.state.introCompleted});
  }
}

export function toggle () {
  ContextualSidebarStore.state.isExpanded = !ContextualSidebarStore.state.isExpanded;
  if (!ContextualSidebarStore.state.calloutSeen) {
    closeCallout();
  }
  events.toggle({isExpanded: ContextualSidebarStore.state.isExpanded, isIntro: !ContextualSidebarStore.state.introCompleted});
  ContextualSidebarStore.actions.render();
}

export function hide () {
  ContextualSidebarStore.state.isExpanded = true;
  toggle();
}

export function toggleVisibility () {
  ContextualSidebarStore.state.isHidden = !ContextualSidebarStore.state.isHidden;
  setStoreValue({isHidden: ContextualSidebarStore.state.isHidden});
  events.toggleVisibility({isHidden: ContextualSidebarStore.state.isHidden, isIntro: !ContextualSidebarStore.state.introCompleted});
  ContextualSidebarStore.actions.render();
}

export function dismissCallout () {
  closeCallout();
  events.dismissCallout();
  ContextualSidebarStore.actions.render();
}

export function continueIntro () {
  if (!ContextualSidebarStore.state.introCompleted && !ContextualSidebarStore.state.isHidden) {
    ContextualSidebarStore.state.introProgress += 1;
    ContextualSidebarStore.state.introStepsRemaining -= 1;
    events.continueIntro();
  }
}

export function completeIntro () {
  if (!ContextualSidebarStore.state.introStepsRemaining && ContextualSidebarStore.state.introCompleted === false) {
    ContextualSidebarStore.state.introCompleted = true;
    setStoreValue({introCompleted: true});
    events.completeIntro();
  }
}

function closeCallout () {
  ContextualSidebarStore.state.calloutSeen = true;
  setStoreValue({calloutSeen: true});
}

function setStoreValue (data) {
  myBrowserStore.set(merge(pick(ContextualSidebarStore.state, ['introCompleted', 'isHidden', 'calloutSeen']), data));
}
