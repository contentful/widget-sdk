import { name as choiceScreenName } from '../stack-onboarding/screens/ChoiceScreen';

export const name = 'createModernOnboarding';

const DEFAULT_LOCALE = 'en-US';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const modalDialog = require('modalDialog');
    const $rootScope = require('$rootScope');
    const { getStore } = require('TheStore');
    const { track } = require('analytics/Analytics.es6');

    const client = require('client');
    const spaceContext = require('spaceContext');
    const $state = require('$state');
    const { refresh, user$ } = require('services/TokenStore.es6');
    const Entries = require('data/Entries');

    const Resource = require('app/api/CMATokens/Resource.es6');
    const auth = require('Authentication.es6');
    const { getValue } = require('utils/kefir.es6');

    const store = getStore();

    const createModernOnboarding = {
      MODERN_STACK_ONBOARDING_SPACE_NAME: 'Gatsby Starter for Contentful',
      MODERN_STACK_ONBOARDING_FEATURE_FLAG: 'feature-dl-05-2018-modern-stack-onboarding',
      MODERN_STACK_ONBOARDING_COMPLETE_EVENT: 'onboardingComplete',
      getUser: () => getValue(user$),
      getStoragePrefix: () =>
        `ctfl:${createModernOnboarding.getUser().sys.id}:modernStackOnboarding`,
      getDeploymentProvider: () =>
        store.get(`${createModernOnboarding.getStoragePrefix()}:deploymentProvider`),
      isOnboardingComplete: () =>
        store.get(`${createModernOnboarding.getStoragePrefix()}:completed`),
      isDevOnboardingSpace: currentSpace => {
        const currentSpaceId = currentSpace && currentSpace.getSys().id;
        const currentSpaceName = currentSpace && currentSpace.data.name;
        const msDevChoiceSpace = store.get(
          `${createModernOnboarding.getStoragePrefix()}:developerChoiceSpace`
        );

        return (
          !!currentSpace &&
          (currentSpaceId === msDevChoiceSpace ||
            currentSpaceName === createModernOnboarding.MODERN_STACK_ONBOARDING_SPACE_NAME)
        );
      },
      isContentOnboardingSpace: currentSpace => {
        const currentSpaceId = currentSpace && currentSpace.getSys().id;
        const msContentChoiceSpace = store.get(
          `${createModernOnboarding.getStoragePrefix()}:contentChoiceSpace`
        );

        return !!currentSpace && currentSpaceId === msContentChoiceSpace;
      },
      /**
       * @description
       * Get the first entry that has content type "person"
       *
       * @return {Promise<Entry>}
       */
      async getPerson() {
        const person = 'person';
        const personEntryPromise = spaceContext.space.getEntries({ content_type: person });
        const personCTPromise = spaceContext.space.getContentType(person);

        try {
          const [personEntry, personCT] = await Promise.all([personEntryPromise, personCTPromise]);

          if (!personEntry.total) {
            return null;
          }

          // this is needed as getEntries returns entries with internal field ids
          return Entries.internalToExternal(personEntry[0].data, personCT.data);
        } catch (_) {
          return null;
        }
      },
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

            const newSpace = await createSpace({
              closeModal,
              org,
              markOnboarding,
              markSpace: createModernOnboarding.markSpace,
              userId: user.sys.id
            });

            createModernOnboarding.createDeliveryToken();
            createModernOnboarding.createManagementToken();

            return newSpace;
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
      markSpace: spaceId => {
        store.set(getMSOnboardingSpaceKey(), spaceId);
      },
      checkSpace: spaceId => store.get(getMSOnboardingSpaceKey()) === spaceId,
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
        const data = await Resource.create(auth).create(
          'Gatsby Starter for Contentful import token'
        );
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
      getCredentials: () =>
        Promise.all([
          createModernOnboarding.getDeliveryToken(),
          createModernOnboarding.getManagementToken()
        ]).then(([deliveryToken, managementToken]) => ({ managementToken, deliveryToken }))
    };

    return createModernOnboarding;

    function getPersonalAccessTokenKey() {
      return `${createModernOnboarding.getStoragePrefix()}:personalAccessToken`;
    }

    function getMSOnboardingSpaceKey() {
      return `${createModernOnboarding.getStoragePrefix()}:developerChoiceSpace`;
    }

    async function createSpace({ closeModal, org, markOnboarding, markSpace, userId }) {
      const newSpace = await client.createSpace(
        {
          name: createModernOnboarding.MODERN_STACK_ONBOARDING_SPACE_NAME,
          defaultLocale: DEFAULT_LOCALE
        },
        org.sys.id
      );

      const newSpaceId = newSpace.sys.id;
      // we need to mark space as onboarding before transitioning
      // because otherwise it won't let us do that
      // all onboarding steps are guarded by space id
      markSpace(newSpaceId, userId);
      markOnboarding();

      await refresh();
      await $state.go('spaces.detail.onboarding.getStarted', { spaceId: newSpaceId });
      // if we need to close modal, we need to do it after redirect
      closeModal && closeModal();

      return newSpace;
    }
  }
]);
