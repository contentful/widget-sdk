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

const STORE_KEY = 'docsSidebar';

const defaults = {
  isExpanded: false,
  isHidden: false,
  calloutSeen: false,
  introCompleted: false,
  introProgress: 1,
  token: '<YOUR TOKEN>',
  spaceId: '<YOUR SPACE ID>'
};

const state = merge(defaults, TheStore.get(STORE_KEY));

export function get () {
  return state;
}

export function setView (view) {
  state.view = view;
  if (state.isExpanded && !state.isHidden) {
    events.navigateWhileOpen(view);
  }
}

export function toggle () {
  state.isExpanded = !state.isExpanded;
  if (!state.calloutSeen) {
    closeCallout();
  }
  events.toggle(state.isExpanded);
}

export function toggleVisibility () {
  state.isHidden = !state.isHidden;
  setStoreValue({isHidden: state.isHidden});
  events.toggleVisibility(state.isHidden);
}

export function dismissCallout () {
  closeCallout();
  events.dismissCallout();
}

export function continueIntro () {
  if (!state.introCompleted && !state.isHidden && state.isExpanded) {
    state.introProgress += 1;
    events.continueIntro();
  }
}

export function completeIntro () {
  if (state.introProgress === 10 && state.introCompleted === false) {
    state.introCompleted = true;
    setStoreValue({introCompleted: true});
    events.completeIntro();
  }
}

export function markCopied (id, isCopied) {
  state.copyButtons[id].copied = isCopied;
}

function closeCallout () {
  state.calloutSeen = true;
  setStoreValue({calloutSeen: true});
}

function setStoreValue (data) {
  TheStore.set(
    STORE_KEY,
    merge(pick(state, ['introCompleted', 'isHidden', 'calloutSeen']), data)
  );
}
