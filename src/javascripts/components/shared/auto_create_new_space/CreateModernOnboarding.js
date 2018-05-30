import {name as choiceScreenName} from '../stack-onboarding/screens/ChoiceScreen';

export const name = 'createModernOnboarding';

const DEFAULT_LOCALE = 'en-US';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const modalDialog = require('modalDialog');
  const $rootScope = require('$rootScope');
  const { getStore } = require('TheStore');

  const client = require('client');
  const spaceContext = require('spaceContext');
  const $state = require('$state');
  const { refresh } = require('services/TokenStore');

  const store = getStore();

  const createModernOnboarding = {
    create: ({ onDefaultChoice, org, markOnboarding }) => {
      const scope = $rootScope.$new();
      let dialog;
      const closeModal = () => {
        dialog && dialog.destroy();
      };
      scope.props = {
        onDefaultChoice: () => {
          closeModal();
          onDefaultChoice();
        },
        createSpace: () => {
          return createSpace({
            closeModal,
            org,
            markOnboarding,
            markSpace: createModernOnboarding.markSpace
          });
        }
      };

      dialog = modalDialog.open({
        title: 'Space auto creation',
        template: `<react-component name="${choiceScreenName}" props="props"></react-component`,
        backgroundClose: false,
        ignoreEsc: true,
        // we don't want to close this modal after we create new space
        // so url will be different
        persistOnNavigation: true,
        scope
      });
    },
    markSpace: (spaceId) => {
      store.set(getKey(spaceId), true);
    },
    checkSpace: (spaceId) => {
      return Boolean(store.get(getKey(spaceId)));
    }
  };

  return createModernOnboarding;

  function getKey (spaceId) {
    return `ctfl:${spaceId}:modernStackOnboarding:space`;
  }

  async function createSpace ({ closeModal, org, markOnboarding, markSpace }) {
    const newSpace = await client.createSpace({
      name: 'Modern Stack Website',
      defaultLocale: DEFAULT_LOCALE
    }, org.sys.id);

    const newSpaceId = newSpace.sys.id;
    // we need to mark space as onboarding before transitioning
    // because otherwise it won't let us do that
    // all onboarding steps are guarded by space id
    markSpace(newSpaceId);
    markOnboarding();

    await refresh();
    await $state.go('spaces.detail.onboarding.getStarted', {spaceId: newSpaceId});
    // if we need to close modal, we need to do it after redirect
    closeModal && closeModal();

    spaceContext.apiKeyRepo.create(
      'Example Key',
      'We’ve created an example API key for you to help you get started.'
    );
  }
}]);
