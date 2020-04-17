import { Notification } from '@contentful/forma-36-react-components';
import accountState from './account';
import spacesState from 'states/Spaces';
import homeState from 'states/Home';
import DeeplinkPage from 'states/deeplink/DeeplinkPage';
import { getMarketplaceApps } from 'states/deeplink/utils';
import userInvitationState from 'states/UserInvitationState';
import { getQueryString, getLocationHref } from 'utils/location';

import { getModule } from 'core/NgRegistry';

/**
 * @description deeplink route to point users to certain sections,
 * without knowing some details (e.g. navigate to API keys sections,
 * but without specifying their spaceId)
 *
 * Sometimes customer support has to describe "click here and there",
 * in order to explain how to get to some page. This is hard for every-
 * one, both for us and for customers, and this route should solve this
 * exact problem. It infers all parameters from previous usage, or just
 * picks the first one (e.g. first space from all available)
 *
 * @usage
 * https://app.contentful.com/deeplink?link=api
 */

const deeplinkState = {
  name: 'deeplink',
  url: '/deeplink',
  component: DeeplinkPage,
  resolve: {
    searchParams: [() => getQueryString()],
    marketplaceApps: ['searchParams', ({ link }) => (link === 'apps' ? getMarketplaceApps() : {})],
  },
  mapInjectedToProps: [
    'searchParams',
    'marketplaceApps',
    (searchParams, marketplaceApps) => ({
      href: getLocationHref(),
      searchParams,
      marketplaceApps,
    }),
  ],
};

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
      redirectTo: 'home',
    },
    {
      name: 'error',
      url: 'error',
      controller: function () {
        Notification.error(
          'We were unable to process your request. ' +
            'If this problem persists, please contact support',
          {
            id: 'load-all-error-notification',
          }
        );
      },
    },
  ]);
}

/**
 * Load only the given states. Used for testing
 */
export function load(states) {
  const config = getModule('states/config');
  (states || []).forEach((state) => config.add(state));
  config.init();
}
