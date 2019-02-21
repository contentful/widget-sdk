import { Notification } from '@contentful/forma-36-react-components';
import accountState from './account.es6';
import spacesState from 'states/Spaces.es6';
import homeState from 'states/Home.es6';
import deeplinkState from 'states/Deeplink.es6';
import userInvitationState from 'states/UserInvitationState.es6';

import { getModule } from 'NgRegistry.es6';

const config = getModule('states/config');

/**
 * Imports all the root states and and adds them to the router.
 * Needs to be called in a 'run' hook to make the application work
 */
export function loadAll() {
  load([
    accountState,
    spacesState,
    homeState,
    deeplinkState,
    userInvitationState,
    {
      name: '_other',
      url: '/*path',
      redirectTo: 'home'
    },
    {
      name: 'error',
      url: 'error',
      controller: function() {
        Notification.error(
          'We were unable to process your request. ' +
            'If this problem persists, please contact support'
        );
      }
    }
  ]);
}

/**
 * Load only the given states. Used for testing
 */
export function load(states) {
  (states || []).forEach(state => config.add(state));
  config.init();
}
