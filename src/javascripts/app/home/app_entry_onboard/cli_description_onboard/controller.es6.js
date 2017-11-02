import {refresh as refreshTokenStore} from 'services/TokenStore';
import {go as gotoState} from 'states/Navigator';
import * as Authentication from 'Authentication';
import {makeReducer, createStore} from 'ui/Framework/Store';
import {makeCtor as makeConstructor} from 'utils/TaggedValues';
import {makeFetchSpacesWithAuth} from 'data/CMA/Spaces';
import ModalDialog from 'modalDialog';
import {assign} from 'utils/Collections';
import {throttle} from 'lodash';
import {render as renderTemplate, renderMissingNodeModal} from './template';
import TheStore from 'TheStore';

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

  const detectMovement = throttle(checkActivity, 500);
  window.addEventListener('mousemove', detectMovement);

  // kickoff first request manually
  recheckSpaces();
  // run checking activity to create timeout
  // for inactivity
  checkActivity();

  return () => {
    clearTimeout(checkSpacesTimerId);
    clearTimeout(inactivityTimeoutId);
    window.removeEventListener('mousemove', detectMovement);
  };

  function checkSpaces () {
    fetchSpaces().then((data) => {
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

  function checkActivity () {
    clearTimeout(inactivityTimeoutId);
    if (inactive) {
      inactive = false;
      clearTimeout(checkSpacesTimerId);
      // we want to make an immediate request, and start to poll after
      checkSpaces();
    } else {
      inactivityTimeoutId = setTimeout(() => {
        clearTimeout(checkSpacesTimerId);
        inactive = true;
      }, INACTIVITY_INTERVAL);
    }
  }
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
    [SetComplete] (state, data) {
      const spaceId = data.items[0].sys.id;
      return assign(state, { complete: true, spaceId });
    },
    [NavigateToSpace] (state) {
      refreshTokenStore().then(function () {
        return gotoState({
          path: ['spaces', 'detail'],
          params: {
            spaceId: state.spaceId
          }
        });
      });
      return assign(state, { updatingSpaces: true });
    },
    [HandleMissingNode] (state) {
      const template = renderMissingNodeModal();
      ModalDialog.open({ template });
      return state;
    },
    [DummyRender] (state) {
      return state;
    },
    [Back] (state) {
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

  const cleanup = checkSpacesWhileUserIsActive((data) => {
    setCliEntrySuccessFlag(props.user);
    store.dispatch(SetComplete, data);
    cleanup();
  });

  return {
    component,
    cleanup
  };
}

function setCliEntrySuccessFlag (user) {
  TheStore.set(`ctfl:${user.sys.id}:cliEntrySuccess`, true);
}
