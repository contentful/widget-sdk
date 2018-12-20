import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';

/**
 * @ngdoc service
 * @name states
 */
registerFactory('states', [
  'states/config',
  'states/account',
  'states/Spaces.es6',
  'states/Home.es6',
  'states/Deeplink.es6',
  'states/UserInvitationState.es6',
  (
    config,
    accountState,
    { default: spacesState },
    { default: homeState },
    { default: deeplinkState },
    { default: userInvitationState }
  ) => {
    return {
      loadAll: loadAll,
      load: load
    };

    /**
     * @ngdoc method
     * @name states#loadAll
     * @description
     * Imports all the root states and and adds them to the router.
     *
     * Needs to be called in a 'run' hook to make the application work
     */
    function loadAll() {
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
     * @ngdoc method
     * @name states#load
     * @description
     * Load only the given states. Used for testing
     *
     * @param {State[]} states
     */
    function load(states) {
      _.forEach(states, config.add);
      config.init();
    }
  }
]);

registerFactory('states/resolvers', () => {
  editingInterfaceResolver.$inject = ['spaceContext', 'contentType'];
  function editingInterfaceResolver(spaceContext, contentType) {
    return spaceContext.editingInterfaces.get(contentType.data);
  }

  return {
    editingInterface: editingInterfaceResolver
  };
});
