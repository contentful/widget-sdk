import {name as choiceScreenName} from '../stack-onboarding/screens/ChoiceScreen';

export const name = 'createModernOnboarding';

const DEFAULT_LOCALE = 'en-US';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const modalDialog = require('modalDialog');
  const $rootScope = require('$rootScope');
  const { getStore } = require('TheStore');
  const { track } = require('analytics/Analytics');

  const client = require('client');
  const spaceContext = require('spaceContext');
  const $state = require('$state');
  const { refresh } = require('services/TokenStore');

  const Resource = require('app/api/CMATokens/Resource');
  const auth = require('Authentication');

  const { user$ } = require('services/TokenStore');
  const { getValue } = require('utils/kefir');

  const store = getStore();

  const createModernOnboarding = {
    MODERN_STACK_ONBOARDING_SPACE_NAME: 'Gatsby Starter for Contentful',
    getUser: () => getValue(user$),
    getStoragePrefix: () => `ctfl:${createModernOnboarding.getUser().sys.id}:modernStackOnboarding`,
    create: ({ onDefaultChoice, org, user, markOnboarding }) => {
      const scope = $rootScope.$new();
      let dialog;
      const closeModal = () => {
        dialog && dialog.destroy();
      };
      scope.props = {
        onDefaultChoice: () => {
          closeModal();
          createModernOnboarding.track('content_path_selected');
          onDefaultChoice();
        },
        createSpace: async () => {
          createModernOnboarding.track('dev_path_selected');

          await createSpace({
            closeModal,
            org,
            markOnboarding,
            markSpace: createModernOnboarding.markSpace,
            userId: user.sys.id
          });

          createModernOnboarding.createDeliveryToken();
          createModernOnboarding.createManagementToken();
        }
      };

      dialog = modalDialog.open({
        title: 'Select your path',
        template: `<react-component name="${choiceScreenName}" props="props"></react-component>`,
        backgroundClose: false,
        ignoreEsc: true,
        // we don't want to close this modal after we create new space
        // so url will be different
        persistOnNavigation: true,
        scope
      });
    },
    markSpace: (spaceId) => {
      store.set(getMSOnboardingSpaceKey(), spaceId);
    },
    checkSpace: (spaceId) => store.get(getMSOnboardingSpaceKey()) === spaceId,
    // used for grouping all related analytics events
    getGroupId: () => 'modernStackOnboarding',
    track: (elementId, toState) => {
      const payload = {
        elementId,
        groupId: createModernOnboarding.getGroupId(),
        fromState: $state.current.name
      };

      if (toState) {
        payload.toState = toState;
      }

      track('element:click', payload);
    },
    getDeliveryToken: async () => {
      const keys = await spaceContext.apiKeyRepo.getAll();
      const key = keys[0];

      if (key) {
        return key.accessToken;
      } else {
        const createdKey = await createModernOnboarding.createDeliveryToken();

        return createdKey.accessToken;
      }
    },
    createDeliveryToken: () => {
      return spaceContext.apiKeyRepo.create(
        'Example Key',
        'We’ve created an example API key for you to help you get started.'
      );
    },
    createManagementToken: async () => {
      const data = await Resource.create(auth).create('Gatsby Starter for Contentful import token');
      const token = data.token;

      store.set(getPersonalAccessTokenKey(), token);

      return token;
    },
    getManagementToken: () => {
      const token = store.get(getPersonalAccessTokenKey());

      if (token) {
        return token;
      }

      return createModernOnboarding.createManagementToken();
    },
    getCredentials: () => Promise.all([
      createModernOnboarding.getDeliveryToken(),
      createModernOnboarding.getManagementToken()
    ]).then(([deliveryToken, managementToken]) => ({ managementToken, deliveryToken }))

  };

  return createModernOnboarding;

  function getPersonalAccessTokenKey () {
    return `${createModernOnboarding.getStoragePrefix()}:personalAccessToken`;
  }

  function getMSOnboardingSpaceKey () {
    return `${createModernOnboarding.getStoragePrefix()}:developerChoiceSpace`;
  }

  async function createSpace ({ closeModal, org, markOnboarding, markSpace, userId }) {
    const newSpace = await client.createSpace({
      name: createModernOnboarding.MODERN_STACK_ONBOARDING_SPACE_NAME,
      defaultLocale: DEFAULT_LOCALE
    }, org.sys.id);

    const newSpaceId = newSpace.sys.id;
    // we need to mark space as onboarding before transitioning
    // because otherwise it won't let us do that
    // all onboarding steps are guarded by space id
    markSpace(newSpaceId, userId);
    markOnboarding();

    await refresh();
    await $state.go('spaces.detail.onboarding.getStarted', {spaceId: newSpaceId});
    // if we need to close modal, we need to do it after redirect
    closeModal && closeModal();

    return newSpace;
  }
}]);
