/* global window, clearTimeout, setTimeout */

import * as TokenStore from 'services/TokenStore';
import * as Navigator from 'states/Navigator';
import * as Authentication from 'Authentication';
import {makeReducer, createStore} from 'ui/Framework/Store';
import {makeCtor as makeConstructor} from 'utils/TaggedValues';
import {makeFetchSpacesWithAuth} from 'data/CMA/Spaces';
import ModalDialog from 'modalDialog';
import {assign} from 'utils/Collections';
import {throttle} from 'lodash';
import {render as renderTemplate, renderMissingNodeModal} from './template';

// We don't want to fetch user's spaces too often
// and we enable button as soon as any space was added
// so, at the moment user will switch back from the CLI
// this check should be already fetched, even with 10s
// delay
const REFRESH_SPACES_INTERVAL = 10000;

// Interval in ms after which we stop re-fetching his spaces
// we measure inactivity by not moving user's mouse
// as soon as he moves his mouse after inactive period, we
// start to fetch spaces again
const INACTIVITY_INTERVAL = 60000;

// Fetches data from the '/spaces' endpoint and returns
// list of spaces with metadata for pagination
// This method is used opposed to the TokenStore#refresh
// due to the cost of the latter
const fetchSpaces = makeFetchSpacesWithAuth(Authentication);

/**
 * @description function to poll user's spaces when user is active
 * by active we mean he moves his mouse, and after INACTIVITY_INTERVAL
 * we stop to poll to avoid a lot of unnecessary requests
 *
 * @param {Function} fn - success handler, called after user have some spaces
 */
function checkSpacesWhileUserIsActive (fn) {
  let checkSpacesTimerId;
  let inactivityTimeoutId;
  let inactive = false;

  function checkSpaces () {
    fetchSpaces().then(function (data) {
      if (data.total > 0) {
        fn(data);
      } else {
        // if we still have 0 spaces, then we need to do it once again
        recheckSpaces();
      }
    // if we fail during the fetching, let's just fetch again after
    // REFRESH_INTERVAL
    }, recheckSpaces);
  }

  function recheckSpaces () {
    clearTimeout(checkSpacesTimerId);
    if (!inactive) {
      checkSpacesTimerId = setTimeout(checkSpaces, REFRESH_SPACES_INTERVAL);
    }
  }

  const checkActivity = () => {
    clearTimeout(inactivityTimeoutId);
    if (inactive) {
      inactive = false;
      clearTimeout(checkSpacesTimerId);
      // we want to make an immediate request, and start to poll after
      checkSpaces();
    } else {
      inactivityTimeoutId = setTimeout(() => {
        setTimeout(checkSpacesTimerId);
        inactive = true;
      }, INACTIVITY_INTERVAL);
    }
  };

  const detectMoving = throttle(checkActivity, 500);
  window.addEventListener('mousemove', detectMoving);

  // kickoff first request manually
  recheckSpaces();
  // run checking activity to create timeout
  // for inactivity
  checkActivity();

  return {
    cleanListeners: () => {
      clearTimeout(checkSpacesTimerId);
      clearTimeout(inactivityTimeoutId);
      window.removeEventListener('mousemove', detectMoving);
    }
  };
}

export function createCliDescriptionComponent (props) {
  // this function is needed to re-render the component
  // after we click on copy. We create a dummy function
  // which returns the state in reducer, and store-bridge
  // re-renders, because state$ receives new value
  const DummyRender = makeConstructor('DummyRender');
  const SetComplete = makeConstructor('SetComplete');
  const Back = makeConstructor('Back');
  const NavigateToSpace = makeConstructor('NavigateToSpace');
  const HandleMissingNode = makeConstructor('HandleMissingNode');
  const reducer = makeReducer({
    [SetComplete]: function (state, data) {
      const spaceId = data.items[0].sys.id;
      return assign(state, { complete: true, spaceId });
    },
    [NavigateToSpace]: function (state) {
      TokenStore.refresh().then(function () {
        return Navigator.go({
          path: ['spaces', 'detail'],
          params: {
            spaceId: state.spaceId
          }
        });
      });
      return assign(state, { updatingSpaces: true });
    },
    [HandleMissingNode]: function (state) {
      const template = renderMissingNodeModal();
      ModalDialog.open({ template });
      return state;
    },
    [DummyRender]: function (state) {
      return state;
    },
    [Back]: function (state) {
      props.back();
      return state;
    }
  });

  const store = createStore({
    spaceId: null,
    complete: false,
    updatingSpaces: false
  }, reducer);

  const actions = {
    handleMissingNode: HandleMissingNode,
    navigateToSpace: NavigateToSpace,
    render: DummyRender,
    back: Back
  };

  const component = {
    render: renderTemplate,
    store,
    actions
  };

  const { cleanListeners } = checkSpacesWhileUserIsActive((data) => {
    store.dispatch(SetComplete, data);
    cleanListeners();
  });

  return {
    component,
    cleanup: cleanListeners
  };
}
