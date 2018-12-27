import { getStore } from 'TheStore/index.es6';
import * as Analytics from 'analytics/Analytics.es6';

import { refresh, user$ } from 'services/TokenStore.es6';

import { create as createToken } from 'app/api/CMATokens/Resource.es6';
import * as auth from 'Authentication.es6';
import { getValue } from 'utils/kefir.es6';
import { getModule } from 'NgRegistry.es6';

const modalDialog = getModule('modalDialog');
const $rootScope = getModule('$rootScope');
const client = getModule('client');
const spaceContext = getModule('spaceContext');
const $state = getModule('$state');
const Entries = getModule('data/Entries');

const DEFAULT_LOCALE = 'en-US';

const store = getStore();

export const MODERN_STACK_ONBOARDING_SPACE_NAME = 'Gatsby Starter for Contentful';
export const MODERN_STACK_ONBOARDING_FEATURE_FLAG = 'feature-dl-05-2018-modern-stack-onboarding';
export const MODERN_STACK_ONBOARDING_COMPLETE_EVENT = 'onboardingComplete';
export const getUser = () => getValue(user$);
export const getStoragePrefix = () => `ctfl:${getUser().sys.id}:modernStackOnboarding`;
export const getDeploymentProvider = () => store.get(`${getStoragePrefix()}:deploymentProvider`);
export const isOnboardingComplete = () => store.get(`${getStoragePrefix()}:completed`);
export const isDevOnboardingSpace = currentSpace => {
  const currentSpaceId = currentSpace && currentSpace.getSys().id;
  const currentSpaceName = currentSpace && currentSpace.data.name;
  const msDevChoiceSpace = store.get(`${getStoragePrefix()}:developerChoiceSpace`);

  return (
    !!currentSpace &&
    (currentSpaceId === msDevChoiceSpace || currentSpaceName === MODERN_STACK_ONBOARDING_SPACE_NAME)
  );
};
export const isContentOnboardingSpace = currentSpace => {
  const currentSpaceId = currentSpace && currentSpace.getSys().id;
  const msContentChoiceSpace = store.get(`${getStoragePrefix()}:contentChoiceSpace`);

  return !!currentSpace && currentSpaceId === msContentChoiceSpace;
};
/**
 * @description
 * Get the first entry that has content type "person"
 *
 * @return {Promise<Entry>}
 */
export const getPerson = async () => {
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
};
export const markSpace = spaceId => {
  store.set(getMSOnboardingSpaceKey(), spaceId);
};
export const checkSpace = spaceId => store.get(getMSOnboardingSpaceKey()) === spaceId;
// used for grouping all related analytics events
export const getGroupId = () => 'modernStackOnboarding';
export const createDeliveryToken = () => {
  return spaceContext.apiKeyRepo.create(
    'Example Key',
    'We’ve created an example API key for you to help you get started.'
  );
};
export const createManagementToken = async () => {
  const data = await createToken(auth).create('Gatsby Starter for Contentful import token');
  const token = data.token;

  store.set(getPersonalAccessTokenKey(), token);

  return token;
};
export const getManagementToken = () => {
  const token = store.get(getPersonalAccessTokenKey());

  if (token) {
    return token;
  }

  return createManagementToken();
};
export const track = (elementId, toState) => {
  const payload = {
    elementId,
    groupId: getGroupId(),
    fromState: $state.current.name
  };

  if (toState) {
    payload.toState = toState;
  }

  Analytics.track('element:click', payload);
};
export const getDeliveryToken = async () => {
  const keys = await spaceContext.apiKeyRepo.getAll();
  const key = keys[0];

  if (key) {
    return key.accessToken;
  } else {
    const createdKey = await createDeliveryToken();

    return createdKey.accessToken;
  }
};
export const create = ({ onDefaultChoice, org, user, markOnboarding }) => {
  const scope = $rootScope.$new();

  const dialog = modalDialog.open({
    title: 'Select your path',
    template: `<react-component name="components/shared/stack-onboarding/screens/ChoiceScreen.es6" props="props"></react-component>`,
    backgroundClose: false,
    ignoreEsc: true,
    // we don't want to close this modal after we create new space
    // so url will be different
    persistOnNavigation: true,
    scope
  });

  const closeModal = () => {
    dialog && dialog.destroy();
  };

  scope.props = {
    onDefaultChoice: () => {
      closeModal();
      track('content_path_selected');
      onDefaultChoice();
    },
    createSpace: async () => {
      track('dev_path_selected');

      const newSpace = await createSpace({
        closeModal,
        org,
        markOnboarding,
        markSpace,
        userId: user.sys.id
      });

      createDeliveryToken();
      createManagementToken();

      return newSpace;
    }
  };
};
export const getCredentials = () =>
  Promise.all([getDeliveryToken(), getManagementToken()]).then(
    ([deliveryToken, managementToken]) => ({ managementToken, deliveryToken })
  );

function getPersonalAccessTokenKey() {
  return `${getStoragePrefix()}:personalAccessToken`;
}

function getMSOnboardingSpaceKey() {
  return `${getStoragePrefix()}:developerChoiceSpace`;
}

async function createSpace({ closeModal, org, markOnboarding, markSpace, userId }) {
  const newSpace = await client.createSpace(
    {
      name: MODERN_STACK_ONBOARDING_SPACE_NAME,
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
