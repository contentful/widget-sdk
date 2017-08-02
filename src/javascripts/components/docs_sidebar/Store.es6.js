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
  introTotalSteps: 4,
  token: '<YOUR TOKEN>',
  spaceId: '<YOUR SPACE ID>',
  entryId: '<YOUR ENTRY ID>',
  contentType: {
    id: '<CONTENT TYPE ID>',
    name: '<CONTENT TYPE NAME>'
  }
};

const state = merge(defaults, TheStore.get(STORE_KEY));

export function get () {
  return state;
}

export function setView (view) {
  state.view = view;
  if (state.isExpanded && !state.isHidden) {
    events.navigateWhileOpen({isIntro: !state.introCompleted});
  }
}

export function setSpaceData ({ spaceId, entryId, contentType }) {
  state.spaceId = spaceId;
  state.entryId = entryId;
  state.contentType = contentType;
}

export function setToken (token) {
  state.token = token;
}

export function toggle () {
  state.isExpanded = !state.isExpanded;
  if (!state.calloutSeen) {
    closeCallout();
  }
  events.toggle({isExpanded: state.isExpanded, isIntro: !state.introCompleted});
}

export function hide () {
  state.isExpanded = true;
  toggle();
}

export function toggleVisibility () {
  state.isHidden = !state.isHidden;
  setStoreValue({isHidden: state.isHidden});
  events.toggleVisibility({isHidden: state.isHidden, isIntro: !state.introCompleted});
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
  if (state.introProgress === state.introTotalSteps && state.introCompleted === false) {
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
